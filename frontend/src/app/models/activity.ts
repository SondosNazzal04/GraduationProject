export type QuestionType = 'mcq' | 'true-false' | 'fill-blank';
export type ActivityType = 'quiz' | 'assignment';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  correctAnswer: string;
  grade: number;        // academic score value (e.g. 10)
  points: number;       // reward points (e.g. 50)
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  questions: Question[];
  totalGrade: number;
  totalPoints: number;
  dueDate?: string;        // e.g. '2026-04-30'
  timeLimit?: number;      // in minutes, e.g. 30 (null = no limit)
  createdAt: Date;
}

export interface StudentAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  earnedGrade?: number;   // grade earned for this question
  earnedPoints?: number;  // points earned for this question
}

export interface Submission {
grade: any;
  id: string;
  activityId: string;
  studentName: string;
  answers: StudentAnswer[];
  // Academic
  totalCorrect?: number;
  totalQuestions?: number;
  gradeScore?: number;      // e.g. 80 out of 100
  gradePercentage?: number; // e.g. 80%
  // Points (gamification)
  earnedPoints?: number;    // points student actually earned
  totalPoints?: number;     // max possible points for this activity
  submittedAt: Date;
}

// Ready for future shop system
export interface StudentWallet {
  studentName: string;
  totalPoints: number;
  history: PointTransaction[];
}

export interface PointTransaction {
  id: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  pointsEarned: number;
  date: Date;
}