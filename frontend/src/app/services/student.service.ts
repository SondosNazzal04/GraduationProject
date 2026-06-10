import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';

export interface StudentClass {
  id: string;
  subjectName: string;       // e.g. "History"
  teacherName: string;       // e.g. "Mr. Bashar"
  courseProgress: number;    // 0–100
  nextSession: string;       // e.g. "Today, 1:00 PM"
  dueTasks: number;          // assignments due
  recentGrades: number[];    // last 4 scores
  iconColor: string;         // orange bg for icon
}

export interface StudentAttendanceRecord {
  date: string;              // e.g. "2025-05-12"
  dayLabel: string;          // e.g. "Mon"
  subject: string;
  status: 'present' | 'absent' | 'late';
}

export interface StudentAttendanceSummary {
  overallPercentage: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalDays: number;
  bySubject: { subject: string; percentage: number; present: number; absent: number }[];
  records: StudentAttendanceRecord[];
}

export interface StudentGradeEntry {
  id: string;
  subject: string;
  activityTitle: string;
  activityType: 'exam' | 'assignment' | 'quiz';
  score: number;
  maxScore: number;
  date: string;
  teacherName: string;
}

export interface StudentGradeSummary {
  overallAverage: number;
  examAverage: number;
  assignmentAverage: number;
  quizAverage: number;
  bySubject: { subject: string; average: number; grades: StudentGradeEntry[] }[];
  allGrades: StudentGradeEntry[];
}

@Injectable({ providedIn: 'root' })
export class StudentService {

  private classes: StudentClass[] = [
    { id: 'sc1', subjectName: 'History',  teacherName: 'Mr. Bashar', courseProgress: 91, nextSession: 'Today, 1:00 PM',  dueTasks: 1, recentGrades: [90,92,91,90], iconColor: '#f59e0b' },
    { id: 'sc2', subjectName: 'Math',     teacherName: 'Mr. Wael',   courseProgress: 91, nextSession: 'Today, 8:00 AM',  dueTasks: 1, recentGrades: [88,95,91,87], iconColor: '#f59e0b' },
    { id: 'sc3', subjectName: 'English',  teacherName: 'Mr. Jehad',  courseProgress: 91, nextSession: 'Today, 9:00 AM',  dueTasks: 1, recentGrades: [90,92,91,90], iconColor: '#f59e0b' },
    { id: 'sc4', subjectName: 'Arabic',   teacherName: 'Mr. Naif',   courseProgress: 85, nextSession: 'Today, 10:00 AM', dueTasks: 1, recentGrades: [90,92,91,90], iconColor: '#f59e0b' },
    { id: 'sc5', subjectName: 'Science',  teacherName: 'Mr. Jameel', courseProgress: 78, nextSession: 'Today, 11:00 AM', dueTasks: 1, recentGrades: [88,90,91,90], iconColor: '#f59e0b' },
    { id: 'sc6', subjectName: 'Physics',  teacherName: 'Mr. Saleem', courseProgress: 72, nextSession: 'Today, 12:00 PM', dueTasks: 1, recentGrades: [80,85,91,88], iconColor: '#f59e0b' },
  ];

  private attendance: StudentAttendanceSummary = {
    overallPercentage: 95,
    presentDays: 43,
    absentDays: 2,
    lateDays: 1,
    totalDays: 46,
    bySubject: [
      { subject: 'History', percentage: 97, present: 44, absent: 2 },
      { subject: 'Math',    percentage: 95, present: 43, absent: 3 },
      { subject: 'English', percentage: 93, present: 42, absent: 4 },
      { subject: 'Arabic',  percentage: 98, present: 45, absent: 1 },
      { subject: 'Science', percentage: 91, present: 41, absent: 5 },
      { subject: 'Physics', percentage: 89, present: 40, absent: 6 },
    ],
    records: [
      { date: '2025-06-09', dayLabel: 'Mon', subject: 'Math',    status: 'present' },
      { date: '2025-06-09', dayLabel: 'Mon', subject: 'English', status: 'present' },
      { date: '2025-06-08', dayLabel: 'Sun', subject: 'History', status: 'late'    },
      { date: '2025-06-08', dayLabel: 'Sun', subject: 'Arabic',  status: 'present' },
      { date: '2025-06-07', dayLabel: 'Sat', subject: 'Science', status: 'absent'  },
      { date: '2025-06-06', dayLabel: 'Fri', subject: 'Physics', status: 'present' },
      { date: '2025-06-05', dayLabel: 'Thu', subject: 'Math',    status: 'present' },
      { date: '2025-06-04', dayLabel: 'Wed', subject: 'English', status: 'absent'  },
      { date: '2025-06-03', dayLabel: 'Tue', subject: 'History', status: 'present' },
      { date: '2025-06-02', dayLabel: 'Mon', subject: 'Arabic',  status: 'present' },
    ]
  };

  private gradesSubject$ = new BehaviorSubject<StudentGradeSummary>({
    overallAverage: 90,
    examAverage: 92,
    assignmentAverage: 88,
    quizAverage: 91,
    bySubject: [
      { subject: 'Math',    average: 93, grades: [
        { id:'g1', subject:'Math',    activityTitle:'Midterm Exam',       activityType:'exam',       score:95, maxScore:100, date:'2025-05-10', teacherName:'Mr. Wael'   },
        { id:'g2', subject:'Math',    activityTitle:'Chapter 3 Assignment',activityType:'assignment', score:89, maxScore:100, date:'2025-05-15', teacherName:'Mr. Wael'   },
        { id:'g3', subject:'Math',    activityTitle:'Quiz 4',              activityType:'quiz',       score:92, maxScore:100, date:'2025-05-20', teacherName:'Mr. Wael'   },
      ]},
      { subject: 'English', average: 90, grades: [
        { id:'g4', subject:'English', activityTitle:'Essay Assignment',    activityType:'assignment', score:88, maxScore:100, date:'2025-05-12', teacherName:'Mr. Jehad'  },
        { id:'g5', subject:'English', activityTitle:'Final Exam',          activityType:'exam',       score:94, maxScore:100, date:'2025-05-18', teacherName:'Mr. Jehad'  },
      ]},
      { subject: 'History', average: 88, grades: [
        { id:'g6', subject:'History', activityTitle:'Chapter Test',        activityType:'exam',       score:90, maxScore:100, date:'2025-05-14', teacherName:'Mr. Bashar' },
        { id:'g7', subject:'History', activityTitle:'Research Assignment', activityType:'assignment', score:85, maxScore:100, date:'2025-05-19', teacherName:'Mr. Bashar' },
      ]},
      { subject: 'Arabic',  average: 92, grades: [
        { id:'g8', subject:'Arabic',  activityTitle:'Midterm',             activityType:'exam',       score:93, maxScore:100, date:'2025-05-11', teacherName:'Mr. Naif'   },
        { id:'g9', subject:'Arabic',  activityTitle:'Writing Assignment',  activityType:'assignment', score:91, maxScore:100, date:'2025-05-16', teacherName:'Mr. Naif'   },
      ]},
      { subject: 'Science', average: 87, grades: [
        { id:'g10',subject:'Science', activityTitle:'Lab Exam',            activityType:'exam',       score:88, maxScore:100, date:'2025-05-13', teacherName:'Mr. Jameel' },
        { id:'g11',subject:'Science', activityTitle:'Lab Report',          activityType:'assignment', score:86, maxScore:100, date:'2025-05-21', teacherName:'Mr. Jameel' },
      ]},
      { subject: 'Physics', average: 84, grades: [
        { id:'g12',subject:'Physics', activityTitle:'Unit Exam',           activityType:'exam',       score:85, maxScore:100, date:'2025-05-17', teacherName:'Mr. Saleem' },
        { id:'g13',subject:'Physics', activityTitle:'Problem Set 2',       activityType:'assignment', score:82, maxScore:100, date:'2025-05-22', teacherName:'Mr. Saleem' },
      ]},
    ],
    allGrades: []
  });

  getMyClasses(): Observable<StudentClass[]>              { return of(this.classes); }
  getAttendance(): Observable<StudentAttendanceSummary>   { return of(this.attendance); }
  getGrades(): Observable<StudentGradeSummary>            { return this.gradesSubject$.asObservable(); }
}
