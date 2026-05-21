import { Injectable } from '@angular/core';

export interface Student {
  id: string;
  name: string;
  initials: string;
  attendancePercent: number;
  currentGrade: number;
  points: number;
}

export interface ClassItem {
  id: string;
  name: string;
  time: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  classes: ClassItem[] = [
    { id: 'math', name: 'Math', time: '8:00 Am' },
    { id: 'arabic', name: 'Arabic', time: '9:15 Am' },
    { id: 'english', name: 'English', time: '10:30 Am' },
    { id: 'science', name: 'Science', time: '11:45 Am' }
  ];

  students: Student[] = [
    { id: 'SA', name: 'Sara Ahmad', initials: 'SA', attendancePercent: 95, currentGrade: 50, points: 2984 },
    { id: 'AO', name: 'Ali Omar', initials: 'AO', attendancePercent: 90, currentGrade: 48, points: 3298 },
    { id: 'MA', name: 'Mohamad Awad', initials: 'MA', attendancePercent: 85, currentGrade: 41, points: 1224 },
    { id: 'RK', name: 'Rash Khalid', initials: 'RK', attendancePercent: 88, currentGrade: 50, points: 1926 },
    { id: 'RZ', name: 'Rana Zaid', initials: 'RZ', attendancePercent: 92, currentGrade: 35, points: 860 }
  ];

  quizzes = ['Quiz#1', 'Quiz#2', 'Quiz#3', 'Quiz#4'];
}
