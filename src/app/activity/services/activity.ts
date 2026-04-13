import { Injectable, signal } from '@angular/core';
import {
  Activity,
  Submission,
  StudentAnswer,
  StudentWallet,
  PointTransaction,
} from '../../models/activity';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private activities = signal<Activity[]>(this.load('activities'));
  private submissions = signal<Submission[]>(this.load('submissions'));
  private wallets = signal<StudentWallet[]>(this.load('wallets'));

  activities$ = this.activities.asReadonly();
  submissions$ = this.submissions.asReadonly();
  wallets$ = this.wallets.asReadonly();

  // ── Storage helpers ───────────────────────────────────────────────────────

  private load<T>(key: string): T[] {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  private save(key: string, data: unknown): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ── Activities ────────────────────────────────────────────────────────────

  createActivity(
    activity: Omit<Activity, 'id' | 'createdAt' | 'totalGrade' | 'totalPoints'>,
  ): Activity {
    const totalGrade = activity['questions'].reduce(
      (s: any, q: { grade: any }) => s + (q.grade ?? 0),
      0,
    );
    const totalPoints = activity['questions'].reduce(
      (s: any, q: { points: any }) => s + (q.points ?? 0),
      0,
    );

    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      totalGrade,
      totalPoints,
    };
    this.activities.update((list) => {
      const updated = [...list, newActivity];
      this.save('activities', updated);
      return updated;
    });
    return newActivity;
  }

  updateActivity(updated: Activity): void {
    updated.totalGrade = updated.questions.reduce((s, q) => s + (q.grade ?? 0), 0);
    updated.totalPoints = updated.questions.reduce((s, q) => s + (q.points ?? 0), 0);

    this.activities.update((list) => {
      const newList = list.map((a) => (a.id === updated.id ? updated : a));
      this.save('activities', newList);
      return newList;
    });
  }

  deleteActivity(id: string): void {
    this.activities.update((list) => {
      const updated = list.filter((a) => a.id !== id);
      this.save('activities', updated);
      return updated;
    });
  }

  getActivity(id: string): Activity | undefined {
    return this.activities().find((a) => a.id === id);
  }

  // ── Grading + Points calculation ──────────────────────────────────────────

  private evaluate(
    activity: Activity,
    answers: StudentAnswer[],
  ): {
    gradedAnswers: StudentAnswer[];
    totalCorrect: number;
    gradeScore: number;
    gradePercentage: number;
    earnedPoints: number;
  } {
    let totalCorrect = 0;
    let gradeScore = 0;
    let earnedPoints = 0;

    const gradedAnswers = answers.map((ans) => {
      const question = activity.questions.find((q) => q.id === ans.questionId);
      if (!question) return ans;

      const isCorrect =
        ans.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

      const earnedGrade = isCorrect ? (question.grade ?? 0) : 0;
      const earnedPts = isCorrect ? (question.points ?? 0) : 0;

      if (isCorrect) totalCorrect++;
      gradeScore += earnedGrade;
      earnedPoints += earnedPts;

      return { ...ans, isCorrect, earnedGrade, earnedPoints: earnedPts };
    });

    const gradePercentage =
      activity.totalGrade > 0 ? Math.round((gradeScore / activity.totalGrade) * 100) : 0;

    return { gradedAnswers, totalCorrect, gradeScore, gradePercentage, earnedPoints };
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submitActivity(data: {
    activityId: string;
    studentName: string;
    answers: StudentAnswer[];
  }): Submission {
    const activity = this.getActivity(data.activityId);
    if (!activity) throw new Error('Activity not found');

    const { gradedAnswers, totalCorrect, gradeScore, gradePercentage, earnedPoints } =
      this.evaluate(activity, data.answers);

    const submission: Submission = {
      id: crypto.randomUUID(),
      activityId: data.activityId,
      studentName: data.studentName,
      answers: gradedAnswers,
      totalCorrect,
      totalQuestions: activity.questions.length,
      gradeScore,
      gradePercentage: activity.type === 'quiz' ? gradePercentage : undefined,
      earnedPoints,
      totalPoints: activity.totalPoints,
      submittedAt: new Date(),
      grade: undefined,
    };

    this.submissions.update((list) => {
      const updated = [...list, submission];
      this.save('submissions', updated);
      return updated;
    });

    // Update student wallet
    this.addPointsToWallet(data.studentName, earnedPoints, activity);

    return submission;
  }

  getSubmissionsForActivity(activityId: string): Submission[] {
    return this.submissions().filter((s) => s.activityId === activityId);
  }

  // ── Wallet (for future shop) ──────────────────────────────────────────────

  private addPointsToWallet(studentName: string, points: number, activity: Activity): void {
    const transaction: PointTransaction = {
      id: crypto.randomUUID(),
      studentName,
      activityId: activity.id,
      activityTitle: activity.title,
      pointsEarned: points,
      date: new Date(),
    };

    this.wallets.update((list) => {
      const existing = list.find((w) => w.studentName === studentName);
      let updated: StudentWallet[];

      if (existing) {
        updated = list.map((w) =>
          w.studentName === studentName
            ? { ...w, totalPoints: w.totalPoints + points, history: [...w.history, transaction] }
            : w,
        );
      } else {
        updated = [...list, { studentName, totalPoints: points, history: [transaction] }];
      }

      this.save('wallets', updated);
      return updated;
    });
  }

  getWallet(studentName: string): StudentWallet | undefined {
    return this.wallets().find((w) => w.studentName === studentName);
  }
}
