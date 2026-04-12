import { Injectable, signal } from '@angular/core';
import { Activity, Submission, StudentAnswer } from '../../models/activity';

@Injectable({ providedIn: 'root' })
export class ActivityService {
deleteActivity(id: string): void {
  this.activities.update(list => {
    const updated = list.filter(a => a.id !== id);
    this.saveToStorage('activities', updated);
    return updated;
  });
}

  private activities = signal<Activity[]>(this.loadFromStorage('activities'));
  private submissions = signal<Submission[]>(this.loadFromStorage('submissions'));

  activities$ = this.activities.asReadonly();
  submissions$ = this.submissions.asReadonly();

  // ── Helpers ──────────────────────────────────────────────────────────────

  private loadFromStorage<T>(key: string): T[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
  }

  private saveToStorage(key: string, data: unknown): void {
    localStorage.setItem(key, JSON.stringify(data));
  }
  
updateActivity(updated: Activity): void {
  this.activities.update(list => {
    const newList = list.map(a => a.id === updated.id ? updated : a);
    this.saveToStorage('activities', newList);
    return newList;
  });
}
  // ── Activities ────────────────────────────────────────────────────────────

  createActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Activity {
    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.activities.update(list => {
      const updated = [...list, newActivity];
      this.saveToStorage('activities', updated);
      return updated;
    });
    return newActivity;
  }

  getActivity(id: string): Activity | undefined {
    return this.activities().find(a => a.id === id);
  }

  // ── Grading ───────────────────────────────────────────────────────────────

  private gradeSubmission(activity: Activity, answers: StudentAnswer[]): {
    gradedAnswers: StudentAnswer[];
    grade: number;
    totalCorrect: number;
  } {
    if (activity.type !== 'quiz') {
      return { gradedAnswers: answers, grade: 0, totalCorrect: 0 };
    }

    let totalCorrect = 0;
    const gradedAnswers = answers.map(ans => {
      const question = activity.questions.find(q => q.id === ans.questionId);
      const isCorrect = question
        ? ans.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
        : false;
      if (isCorrect) totalCorrect++;
      return { ...ans, isCorrect };
    });

    const grade = Math.round((totalCorrect / activity.questions.length) * 100);
    return { gradedAnswers, grade, totalCorrect };
  }

  // ── Submissions ───────────────────────────────────────────────────────────

  submitActivity(data: {
    activityId: string;
    studentName: string;
    answers: StudentAnswer[];
  }): Submission {
    const activity = this.getActivity(data.activityId);
    if (!activity) throw new Error('Activity not found');

    const { gradedAnswers, grade, totalCorrect } = this.gradeSubmission(activity, data.answers);

    const submission: Submission = {
      id: crypto.randomUUID(),
      activityId: data.activityId,
      studentName: data.studentName,
      answers: gradedAnswers,
      grade: activity.type === 'quiz' ? grade : undefined,
      totalCorrect: activity.type === 'quiz' ? totalCorrect : undefined,
      totalQuestions: activity.questions.length,
      submittedAt: new Date(),
    };

    this.submissions.update(list => {
      const updated = [...list, submission];
      this.saveToStorage('submissions', updated);
      return updated;
    });

    return submission;
  }

  getSubmissionsForActivity(activityId: string): Submission[] {
    return this.submissions().filter(s => s.activityId === activityId);
  }

  hasStudentSubmitted(activityId: string, studentName: string): boolean {
    return this.submissions().some(
      s => s.activityId === activityId && s.studentName === studentName
    );
  }
}