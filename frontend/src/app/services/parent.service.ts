import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

// ── Models ──────────────────────────────────────────────────

export interface ParentChild {
  id: string; firstName: string; lastName: string; initials: string;
  gradeLevel: string; className: string; venturePoints: number;
  streak: number; attendancePct: number; gpa: number; badgesEarned: number;
  teacherId: string; teacherName: string;
}

export interface AttendanceRecord {
  id: string; childId: string; childName: string;
  date: string; status: 'present' | 'absent' | 'late'; notes: string;
}

export interface GradeRecord {
  id: string; childId: string; subject: string; teacher: string;
  grade: string; percentage: number; status: 'pass' | 'fail' | 'excellent';
}

export interface ClassInfo {
  id: string; name: string; subject: string; teacher: string;
  schedule: string; room: string; childId: string;
}

export interface Achievement {
  id: string; childId: string; title: string; description: string;
  type: 'badge' | 'award' | 'challenge' | 'streak';
  earnedDate: string; icon: string; progress: number; maxProgress: number;
}

export interface Teacher {
  id: string; name: string; initials: string; subject: string;
  email: string; phone: string;
}

export interface LearningProgress {
  childId: string; subject: string; progress: number;
  assignmentsCompleted: number; assignmentsTotal: number;
  quizAverage: number; trend: number[];
}

export interface VenturePointEntry {
  id: string; childId: string; date: string;
  activity: string; points: number; type: 'earned' | 'spent';
}

export interface RewardEntry {
  id: string; childId: string; rewardName: string;
  cost: number; redeemedDate: string; status: 'active' | 'used' | 'expired';
}

export interface SchoolEvent {
  id: string; title: string; date: string; type: string;
}

// ── Service ─────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ParentService {

  selectedChildId = signal('c1');

  private children: ParentChild[] = [
    { id: 'c1', firstName: 'Rama', lastName: 'Omar', initials: 'RO', gradeLevel: '7th Grade', className: '7-A', venturePoints: 1820, streak: 3, attendancePct: 98, gpa: 3.9, badgesEarned: 8, teacherId: 't1', teacherName: 'Mr. Khalid' },
    { id: 'c2', firstName: 'Ali', lastName: 'Omar', initials: 'AO', gradeLevel: '10th Grade', className: '10-B', venturePoints: 2450, streak: 5, attendancePct: 95, gpa: 3.7, badgesEarned: 11, teacherId: 't2', teacherName: 'Ms. Sara' },
  ];

  private attendance: AttendanceRecord[] = [
    { id: 'a1', childId: 'c1', childName: 'Rama Omar', date: '2025-06-09', status: 'present', notes: '' },
    { id: 'a2', childId: 'c1', childName: 'Rama Omar', date: '2025-06-08', status: 'present', notes: '' },
    { id: 'a3', childId: 'c1', childName: 'Rama Omar', date: '2025-06-07', status: 'absent', notes: 'Sick' },
    { id: 'a4', childId: 'c1', childName: 'Rama Omar', date: '2025-06-06', status: 'present', notes: '' },
    { id: 'a5', childId: 'c1', childName: 'Rama Omar', date: '2025-06-05', status: 'late', notes: 'Traffic' },
    { id: 'a6', childId: 'c1', childName: 'Rama Omar', date: '2025-06-04', status: 'present', notes: '' },
    { id: 'a7', childId: 'c2', childName: 'Ali Omar', date: '2025-06-09', status: 'present', notes: '' },
    { id: 'a8', childId: 'c2', childName: 'Ali Omar', date: '2025-06-08', status: 'absent', notes: 'Family event' },
    { id: 'a9', childId: 'c2', childName: 'Ali Omar', date: '2025-06-07', status: 'present', notes: '' },
    { id: 'a10', childId: 'c2', childName: 'Ali Omar', date: '2025-06-06', status: 'present', notes: '' },
  ];

  private grades: GradeRecord[] = [
    { id: 'g1', childId: 'c1', subject: 'Mathematics', teacher: 'Mr. Wael', grade: 'A', percentage: 95, status: 'excellent' },
    { id: 'g2', childId: 'c1', subject: 'English', teacher: 'Mr. Jehad', grade: 'A-', percentage: 91, status: 'excellent' },
    { id: 'g3', childId: 'c1', subject: 'History', teacher: 'Mr. Bashar', grade: 'B+', percentage: 88, status: 'pass' },
    { id: 'g4', childId: 'c1', subject: 'Arabic', teacher: 'Mr. Naif', grade: 'A', percentage: 93, status: 'excellent' },
    { id: 'g5', childId: 'c1', subject: 'Science', teacher: 'Mr. Jameel', grade: 'B', percentage: 84, status: 'pass' },
    { id: 'g6', childId: 'c1', subject: 'Physics', teacher: 'Mr. Saleem', grade: 'B+', percentage: 87, status: 'pass' },
    { id: 'g7', childId: 'c2', subject: 'Mathematics', teacher: 'Mr. Wael', grade: 'A-', percentage: 91, status: 'excellent' },
    { id: 'g8', childId: 'c2', subject: 'Physics', teacher: 'Mr. Saleem', grade: 'B+', percentage: 86, status: 'pass' },
    { id: 'g9', childId: 'c2', subject: 'Chemistry', teacher: 'Ms. Layla', grade: 'B', percentage: 82, status: 'pass' },
    { id: 'g10', childId: 'c2', subject: 'Biology', teacher: 'Mr. Jameel', grade: 'A', percentage: 94, status: 'excellent' },
    { id: 'g11', childId: 'c2', subject: 'English', teacher: 'Mr. Jehad', grade: 'B+', percentage: 88, status: 'pass' },
  ];

  private classes: ClassInfo[] = [
    { id: 'cl1', name: '7-A Math', subject: 'Mathematics', teacher: 'Mr. Wael', schedule: 'Sun–Thu 8:00 AM', room: '101', childId: 'c1' },
    { id: 'cl2', name: '7-A English', subject: 'English', teacher: 'Mr. Jehad', schedule: 'Sun–Thu 9:15 AM', room: '205', childId: 'c1' },
    { id: 'cl3', name: '7-A Arabic', subject: 'Arabic', teacher: 'Mr. Naif', schedule: 'Sun–Thu 10:30 AM', room: '102', childId: 'c1' },
    { id: 'cl4', name: '7-A Science', subject: 'Science', teacher: 'Mr. Jameel', schedule: 'Mon–Wed 11:45 AM', room: 'Lab1', childId: 'c1' },
    { id: 'cl5', name: '10-B Physics', subject: 'Physics', teacher: 'Mr. Saleem', schedule: 'Sun–Thu 8:00 AM', room: '301', childId: 'c2' },
    { id: 'cl6', name: '10-B Chem', subject: 'Chemistry', teacher: 'Ms. Layla', schedule: 'Sun–Thu 9:15 AM', room: 'Lab2', childId: 'c2' },
    { id: 'cl7', name: '10-B Biology', subject: 'Biology', teacher: 'Mr. Jameel', schedule: 'Mon–Wed 10:30 AM', room: 'Lab3', childId: 'c2' },
  ];

  private achievements: Achievement[] = [
    { id: 'ach1', childId: 'c1', title: 'Math Master', description: 'Score 90%+ in 5 consecutive math tests', type: 'badge', earnedDate: '2025-05-20', icon: '📐', progress: 5, maxProgress: 5 },
    { id: 'ach2', childId: 'c1', title: 'Perfect Week', description: '100% attendance for an entire week', type: 'streak', earnedDate: '2025-06-02', icon: '⭐', progress: 5, maxProgress: 5 },
    { id: 'ach3', childId: 'c1', title: 'Reading Star', description: 'Complete 20 reading assignments', type: 'challenge', earnedDate: '2025-05-15', icon: '📚', progress: 18, maxProgress: 20 },
    { id: 'ach4', childId: 'c1', title: 'Team Player', description: 'Complete 10 group projects', type: 'award', earnedDate: '2025-04-10', icon: '🤝', progress: 10, maxProgress: 10 },
    { id: 'ach5', childId: 'c2', title: 'Science Whiz', description: 'Score 90%+ in 5 science tests', type: 'badge', earnedDate: '2025-05-18', icon: '🔬', progress: 5, maxProgress: 5 },
    { id: 'ach6', childId: 'c2', title: 'Streak Champ', description: 'Maintain a 30-day learning streak', type: 'streak', earnedDate: '', icon: '🔥', progress: 22, maxProgress: 30 },
    { id: 'ach7', childId: 'c2', title: 'Top Student', description: 'Rank 1st in class for a full semester', type: 'award', earnedDate: '2025-03-20', icon: '🏆', progress: 1, maxProgress: 1 },
  ];

  private teachers: Teacher[] = [
    { id: 't1', name: 'Mr. Khalid', initials: 'MK', subject: 'Mathematics', email: 'khalid@eduventure.edu', phone: '+962-77-1234567' },
    { id: 't2', name: 'Ms. Sara', initials: 'MS', subject: 'Homeroom', email: 'sara@eduventure.edu', phone: '+962-77-2345678' },
    { id: 't3', name: 'Mr. Wael', initials: 'MW', subject: 'Mathematics', email: 'wael@eduventure.edu', phone: '+962-77-3456789' },
    { id: 't4', name: 'Mr. Jehad', initials: 'MJ', subject: 'English', email: 'jehad@eduventure.edu', phone: '+962-77-4567890' },
    { id: 't5', name: 'Mr. Bashar', initials: 'MB', subject: 'History', email: 'bashar@eduventure.edu', phone: '+962-77-5678901' },
    { id: 't6', name: 'Mr. Naif', initials: 'MN', subject: 'Arabic', email: 'naif@eduventure.edu', phone: '+962-77-6789012' },
    { id: 't7', name: 'Mr. Jameel', initials: 'MJA', subject: 'Science', email: 'jameel@eduventure.edu', phone: '+962-77-7890123' },
    { id: 't8', name: 'Mr. Saleem', initials: 'MSA', subject: 'Physics', email: 'saleem@eduventure.edu', phone: '+962-77-8901234' },
    { id: 't9', name: 'Ms. Layla', initials: 'ML', subject: 'Chemistry', email: 'layla@eduventure.edu', phone: '+962-77-9012345' },
  ];

  private progress: LearningProgress[] = [
    { childId: 'c1', subject: 'Mathematics', progress: 91, assignmentsCompleted: 18, assignmentsTotal: 20, quizAverage: 93, trend: [78, 82, 85, 88, 91, 93] },
    { childId: 'c1', subject: 'English', progress: 85, assignmentsCompleted: 15, assignmentsTotal: 18, quizAverage: 88, trend: [75, 79, 82, 84, 85, 88] },
    { childId: 'c1', subject: 'Arabic', progress: 88, assignmentsCompleted: 16, assignmentsTotal: 18, quizAverage: 90, trend: [80, 83, 85, 87, 88, 90] },
    { childId: 'c1', subject: 'Science', progress: 78, assignmentsCompleted: 12, assignmentsTotal: 16, quizAverage: 84, trend: [70, 73, 75, 77, 78, 84] },
    { childId: 'c2', subject: 'Physics', progress: 86, assignmentsCompleted: 20, assignmentsTotal: 23, quizAverage: 89, trend: [78, 81, 83, 85, 86, 89] },
    { childId: 'c2', subject: 'Chemistry', progress: 80, assignmentsCompleted: 17, assignmentsTotal: 21, quizAverage: 83, trend: [72, 75, 77, 79, 80, 83] },
    { childId: 'c2', subject: 'Biology', progress: 92, assignmentsCompleted: 22, assignmentsTotal: 24, quizAverage: 94, trend: [82, 85, 88, 90, 92, 94] },
  ];

  private vpHistory: VenturePointEntry[] = [
    { id: 'vp1', childId: 'c1', date: '2025-06-09', activity: 'Completed Math Homework', points: 50, type: 'earned' },
    { id: 'vp2', childId: 'c1', date: '2025-06-08', activity: 'Perfect Week Badge', points: 200, type: 'earned' },
    { id: 'vp3', childId: 'c1', date: '2025-06-07', activity: 'Quiz Score 100%', points: 100, type: 'earned' },
    { id: 'vp4', childId: 'c1', date: '2025-06-05', activity: 'Redeemed Mini Notebook', points: -150, type: 'spent' },
    { id: 'vp5', childId: 'c1', date: '2025-06-03', activity: 'Completed Science Lab', points: 75, type: 'earned' },
    { id: 'vp6', childId: 'c2', date: '2025-06-09', activity: 'Completed Physics Assignment', points: 60, type: 'earned' },
    { id: 'vp7', childId: 'c2', date: '2025-06-08', activity: 'Earned 5-Day Streak', points: 150, type: 'earned' },
    { id: 'vp8', childId: 'c2', date: '2025-06-06', activity: 'Redeemed Badge Slot', points: -200, type: 'spent' },
    { id: 'vp9', childId: 'c2', date: '2025-06-04', activity: 'Top Score in Biology', points: 100, type: 'earned' },
  ];

  private rewards: RewardEntry[] = [
    { id: 'r1', childId: 'c1', rewardName: 'Mini Notebook', cost: 150, redeemedDate: '2025-06-05', status: 'active' },
    { id: 'r2', childId: 'c1', rewardName: 'Extra Break Time', cost: 100, redeemedDate: '2025-05-20', status: 'used' },
    { id: 'r3', childId: 'c1', rewardName: 'School Badge', cost: 200, redeemedDate: '2025-05-10', status: 'used' },
    { id: 'r4', childId: 'c2', rewardName: 'Badge Slot', cost: 200, redeemedDate: '2025-06-06', status: 'active' },
    { id: 'r5', childId: 'c2', rewardName: 'Pen Set', cost: 100, redeemedDate: '2025-05-15', status: 'used' },
  ];

  private events: SchoolEvent[] = [
    { id: 'e1', title: 'Parent-Teacher Meeting', date: '2025-06-15', type: 'meeting' },
    { id: 'e2', title: 'Science Fair', date: '2025-06-20', type: 'event' },
    { id: 'e3', title: 'End of Year Ceremony', date: '2025-06-28', type: 'ceremony' },
    { id: 'e4', title: 'Mid-Year Exams Begin', date: '2025-07-01', type: 'exam' },
  ];

  // ── Public Methods ──────────────────────────────────────
  getChildren(): Observable<ParentChild[]> { return of(this.children); }
  getAttendance(cid?: string): Observable<AttendanceRecord[]> { return of(cid ? this.attendance.filter(a => a.childId === cid) : this.attendance); }
  getGrades(cid?: string): Observable<GradeRecord[]> { return of(cid ? this.grades.filter(g => g.childId === cid) : this.grades); }
  getClasses(cid?: string): Observable<ClassInfo[]> { return of(cid ? this.classes.filter(c => c.childId === cid) : this.classes); }
  getAchievements(cid?: string): Observable<Achievement[]> { return of(cid ? this.achievements.filter(a => a.childId === cid) : this.achievements); }
  getTeachers(): Observable<Teacher[]> { return of(this.teachers); }
  getLearningProgress(cid?: string): Observable<LearningProgress[]> { return of(cid ? this.progress.filter(p => p.childId === cid) : this.progress); }
  getVenturePoints(cid?: string): Observable<VenturePointEntry[]> { return of(cid ? this.vpHistory.filter(v => v.childId === cid) : this.vpHistory); }
  getRewards(cid?: string): Observable<RewardEntry[]> { return of(cid ? this.rewards.filter(r => r.childId === cid) : this.rewards); }
  getEvents(): Observable<SchoolEvent[]> { return of(this.events); }
}
