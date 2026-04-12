
    export interface Question {
  id?: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface Activity {
  id?: string;
  title: string;
  subject: string;
  type: 'quiz' | 'homework' | 'project';
  questions: Question[];
  dueDate: Date;
  totalPoints: number;
}

