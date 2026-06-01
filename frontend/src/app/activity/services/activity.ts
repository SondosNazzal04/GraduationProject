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
  private baseUrl = 'http://localhost:3000/api';

  constructor() {
    void this.syncFromBackend();
  }
  hasSubmitted(activityId: string, studentName: string): boolean {
    return this.getSubmissionsForActivity(activityId).some((s) => s.studentName === studentName);
  }
  hasStudentSubmitted(id: string, studentName: string) {
    return this.hasSubmitted(id, studentName);
  }
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

  // Try to sync activities/submissions/wallets from backend (DEV_NO_AUTH can be used to skip auth locally)
  async syncFromBackend(): Promise<void> {
    try {
      const resp = await fetch(`${this.baseUrl}/activities`);
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json.items)) {
          this.activities.set(json.items);
          this.save('activities', json.items);
        }
      }

      // load recent submissions if any
      // Note: listing all submissions requires activityId; we keep local submissions unless user asks to view per-activity.
      const walletResp = await fetch(`${this.baseUrl}/student/me/wallet`);
      if (walletResp.ok) {
        const walletJson = await walletResp.json();
        const wallet = {
          studentName: walletJson.uid || 'me',
          totalPoints: Number(walletJson.pointsBalance || 0),
          history: Array.isArray(walletJson.transactions) ? walletJson.transactions : [],
        } as StudentWallet;
        this.wallets.set([wallet]);
        this.save('wallets', [wallet]);
      }
    } catch (e) {
      // keep local data if backend unavailable
      console.warn('ActivityService: backend sync failed', e);
    }
  }

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
    // attempt to persist to backend first
    void (async () => {
      try {
        const resp = await fetch(`${this.baseUrl}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newActivity),
        });
        if (resp.ok) {
          const json = await resp.json();
          const item = json.item || json;
          this.activities.update((list) => {
            const updated = [...list, item];
            this.save('activities', updated);
            return updated;
          });
          return;
        }
      } catch (e) {
        console.warn('createActivity backend failed, falling back to local', e);
      }

      this.activities.update((list) => {
        const updated = [...list, newActivity];
        this.save('activities', updated);
        return updated;
      });
    })();

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
    // submit to backend if possible, fallback to local evaluation
    void (async () => {
      try {
        const resp = await fetch(`${this.baseUrl}/activities/${encodeURIComponent(
          data.activityId,
        )}/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: data.answers, studentName: data.studentName }),
        });
        if (resp.ok) {
          const json = await resp.json();
          const item = json.item || json;
          this.submissions.update((list) => {
            const updated = [...list, item];
            this.save('submissions', updated);
            return updated;
          });

          // update wallet locally
          try {
            const walletResp = await fetch(`${this.baseUrl}/student/me/wallet`);
            if (walletResp.ok) {
              const walletJson = await walletResp.json();
              const wallet = {
                studentName: walletJson.uid || 'me',
                totalPoints: Number(walletJson.pointsBalance || 0),
                history: Array.isArray(walletJson.transactions) ? walletJson.transactions : [],
              } as StudentWallet;
              this.wallets.update(() => [wallet]);
              this.save('wallets', [wallet]);
            }
          } catch {}

          return;
        }
      } catch (e) {
        console.warn('submitActivity backend failed, falling back to local', e);
      }

      // fallback local evaluation
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
    })();

    // return a placeholder; consumers should observe submissions$ for results
    return {
      id: 'pending',
      activityId: data.activityId,
      studentName: data.studentName,
      answers: data.answers,
      submittedAt: new Date(),
    } as Submission;
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
