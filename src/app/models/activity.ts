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
}

export interface Activity {
subject: any;
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  questions: Question[];
  createdAt: Date;
}

export interface StudentAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;    // auto-filled after grading
}

export interface Submission {
  id: string;
  activityId: string;
  studentName: string;
  answers: StudentAnswer[];
  grade?: number;         // percentage 0–100
  totalCorrect?: number;
  totalQuestions?: number;
  submittedAt: Date;
}