import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { getApiBaseUrl } from '../firebase.runtime-config';

// ── Interfaces ────────────────────────────────────────────────

export interface StudentProfile {
  id: string; name: string; initials: string; gradeLevel: string;
  className: string; email: string; level: number;
  gpa: number; attendancePct: number; venturePoints: number;
  streak: number; rank: number; completedActivities: number; badgesEarned: number;
}

export interface Activity {
  id: string; title: string; subject: string;
  difficulty: 'easy' | 'medium' | 'hard'; dueDate: string;
  status: 'not_started' | 'in_progress' | 'completed'; rewardPoints: number;
  progress: number; description: string;
}

export interface Assignment {
  id: string; name: string; subject: string; dueDate: string;
  teacher: string; status: 'pending' | 'submitted' | 'graded' | 'late';
  grade: string; percentage: number; feedback: string;
}

export interface AttendanceRecord {
  id: string; date: string; subject: string; status: 'present' | 'absent' | 'late'; notes: string;
}

export interface GradeEntry {
  id: string; subject: string; teacher: string;
  grade: string; percentage: number; status: 'excellent' | 'pass' | 'fail';
}

export interface Achievement {
  id: string; title: string; description: string; category: 'academic' | 'attendance' | 'participation' | 'challenge';
  earnedDate: string; xpReward: number; icon: string; earned: boolean; type?: string;
}

export interface VPEntry {
  id: string; activity: string; date: string; points: number; type: 'earned' | 'spent';
}

export interface ShopItem {
  id: string; name: string; description: string; category: string;
  cost: number; available: boolean; emoji: string; popular: boolean;
}

export interface Challenge {
  id: string; name: string; difficulty: 'easy' | 'medium' | 'hard'; deadline: string;
  rewardPoints: number; progress: number; maxProgress: number;
  status: 'available' | 'joined' | 'completed'; description: string;
}

export interface Badge {
  id: string; name: string; description: string; requirement: string;
  dateEarned: string; icon: string; earned: boolean; category: string;
}

export interface Notification {
  id: string; title: string; body: string; type: 'academic' | 'system' | 'reward' | 'message';
  date: string; read: boolean;
}

export interface Message {
  id: string; from: string; initials: string; role: string;
  preview: string; timeAgo: string; unread: boolean;
  messages: { sender: string; text: string; time: string; mine: boolean }[];
}

// ── Service ───────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StudentPortalService {
  private http = inject(HttpClient);
  private apiBaseUrl = getApiBaseUrl();

  profile = signal<StudentProfile>({
    id: '', name: '', initials: '', gradeLevel: '', className: '',
    email: '', level: 0,
    gpa: 0, attendancePct: 0, venturePoints: 0, streak: 0,
    rank: 0, completedActivities: 0, badgesEarned: 0
  });

  private activities: Activity[] = [
    { id: 'a1', title: 'Algebra Problem Set 5', subject: 'Mathematics', difficulty: 'medium', dueDate: '2025-06-12', status: 'in_progress', rewardPoints: 75, progress: 60, description: 'Solve 20 algebra problems covering quadratic equations.' },
    { id: 'a2', title: 'Essay: Climate Change', subject: 'English', difficulty: 'hard', dueDate: '2025-06-14', status: 'not_started', rewardPoints: 100, progress: 0, description: 'Write a 500-word persuasive essay on climate change.' },
    { id: 'a3', title: 'History Quiz Chapter 4', subject: 'History', difficulty: 'easy', dueDate: '2025-06-10', status: 'completed', rewardPoints: 50, progress: 100, description: '10-question quiz on the Ottoman Empire.' },
    { id: 'a4', title: 'Science Lab Report', subject: 'Science', difficulty: 'hard', dueDate: '2025-06-15', status: 'in_progress', rewardPoints: 120, progress: 35, description: 'Document the results of the photosynthesis experiment.' },
    { id: 'a5', title: 'Arabic Reading Exercise', subject: 'Arabic', difficulty: 'easy', dueDate: '2025-06-11', status: 'completed', rewardPoints: 40, progress: 100, description: 'Read and summarize the provided Arabic text.' },
    { id: 'a6', title: 'Physics Forces Worksheet', subject: 'Physics', difficulty: 'medium', dueDate: '2025-06-13', status: 'not_started', rewardPoints: 80, progress: 0, description: 'Complete 15 problems on Newton\'s laws of motion.' },
  ];

  private assignments: Assignment[] = [
    { id: 'as1', name: 'Midterm Math Exam', subject: 'Mathematics', dueDate: '2025-05-20', teacher: 'Mr. Wael', status: 'graded', grade: 'A', percentage: 95, feedback: 'Excellent work on the quadratic section!' },
    { id: 'as2', name: 'English Essay Draft', subject: 'English', dueDate: '2025-06-05', teacher: 'Mr. Jehad', status: 'submitted', grade: '—', percentage: 0, feedback: '' },
    { id: 'as3', name: 'History Chapter Review', subject: 'History', dueDate: '2025-05-28', teacher: 'Mr. Bashar', status: 'graded', grade: 'B+', percentage: 88, feedback: 'Good analysis, improve your conclusion.' },
    { id: 'as4', name: 'Arabic Composition', subject: 'Arabic', dueDate: '2025-06-08', teacher: 'Mr. Naif', status: 'graded', grade: 'A-', percentage: 91, feedback: 'Very well written.' },
    { id: 'as5', name: 'Science Lab Report', subject: 'Science', dueDate: '2025-06-15', teacher: 'Mr. Jameel', status: 'pending', grade: '—', percentage: 0, feedback: '' },
    { id: 'as6', name: 'Physics Problem Set', subject: 'Physics', dueDate: '2025-06-13', teacher: 'Mr. Saleem', status: 'late', grade: '—', percentage: 0, feedback: 'Please submit ASAP.' },
  ];

  private attendance: AttendanceRecord[] = [
    { id: 'at1', date: '2025-06-09', subject: 'Mathematics', status: 'present', notes: '' },
    { id: 'at2', date: '2025-06-09', subject: 'English', status: 'present', notes: '' },
    { id: 'at3', date: '2025-06-08', subject: 'History', status: 'late', notes: 'Traffic delay' },
    { id: 'at4', date: '2025-06-08', subject: 'Arabic', status: 'present', notes: '' },
    { id: 'at5', date: '2025-06-07', subject: 'Science', status: 'absent', notes: 'Sick' },
    { id: 'at6', date: '2025-06-06', subject: 'Physics', status: 'present', notes: '' },
    { id: 'at7', date: '2025-06-05', subject: 'Mathematics', status: 'present', notes: '' },
    { id: 'at8', date: '2025-06-04', subject: 'English', status: 'present', notes: '' },
  ];

  private grades: GradeEntry[] = [
    { id: 'g1', subject: 'Mathematics', teacher: 'Mr. Wael', grade: 'A', percentage: 95, status: 'excellent' },
    { id: 'g2', subject: 'English', teacher: 'Mr. Jehad', grade: 'A-', percentage: 91, status: 'excellent' },
    { id: 'g3', subject: 'History', teacher: 'Mr. Bashar', grade: 'B+', percentage: 88, status: 'pass' },
    { id: 'g4', subject: 'Arabic', teacher: 'Mr. Naif', grade: 'A', percentage: 93, status: 'excellent' },
    { id: 'g5', subject: 'Science', teacher: 'Mr. Jameel', grade: 'B', percentage: 84, status: 'pass' },
    { id: 'g6', subject: 'Physics', teacher: 'Mr. Saleem', grade: 'B+', percentage: 87, status: 'pass' },
  ];

  private achievements: Achievement[] = [
    { id: 'ach1', title: 'Math Master', description: 'Score 90%+ in 5 consecutive math tests', category: 'academic', earnedDate: '2025-05-20', xpReward: 200, icon: '📐', earned: true },
    { id: 'ach2', title: 'Perfect Week', description: '100% attendance for an entire week', category: 'attendance', earnedDate: '2025-06-02', xpReward: 150, icon: '⭐', earned: true },
    { id: 'ach3', title: 'Team Player', description: 'Complete 10 group projects', category: 'participation', earnedDate: '2025-04-10', xpReward: 100, icon: '🤝', earned: true },
    { id: 'ach4', title: 'Challenge Champ', description: 'Win 5 challenges', category: 'challenge', earnedDate: '2025-05-15', xpReward: 300, icon: '🏆', earned: true },
    { id: 'ach5', title: 'Reading Star', description: 'Complete 20 reading assignments', category: 'academic', earnedDate: '', xpReward: 180, icon: '📚', earned: false },
    { id: 'ach6', title: '30-Day Streak', description: 'Maintain a 30-day learning streak', category: 'attendance', earnedDate: '', xpReward: 250, icon: '🔥', earned: false },
    { id: 'ach7', title: 'Science Whiz', description: 'Score 90%+ in 5 science tests', category: 'academic', earnedDate: '', xpReward: 200, icon: '🔬', earned: false },
    { id: 'ach8', title: 'First Challenge', description: 'Complete your first challenge', category: 'challenge', earnedDate: '2025-03-01', xpReward: 50, icon: '🚀', earned: true },
  ];

  private vpHistory: VPEntry[] = [
    { id: 'v1', activity: 'Completed Math Homework', date: '2025-06-09', points: 50, type: 'earned' },
    { id: 'v2', activity: 'Perfect Week Badge', date: '2025-06-02', points: 200, type: 'earned' },
    { id: 'v3', activity: 'Quiz Score 100%', date: '2025-05-28', points: 100, type: 'earned' },
    { id: 'v4', activity: 'Redeemed Mini Notebook', date: '2025-05-25', points: -150, type: 'spent' },
    { id: 'v5', activity: 'Completed Science Lab', date: '2025-05-22', points: 75, type: 'earned' },
    { id: 'v6', activity: 'Challenge Winner', date: '2025-05-18', points: 300, type: 'earned' },
    { id: 'v7', activity: 'Redeemed Extra Break', date: '2025-05-15', points: -100, type: 'spent' },
    { id: 'v8', activity: 'Daily Login Streak x7', date: '2025-05-10', points: 70, type: 'earned' },
  ];

  private shopItems: ShopItem[] = [
    { id: 'sh1', name: 'Mini Notebook', description: 'Cute notebook for class notes', category: 'stationery', cost: 150, available: true, emoji: '📓', popular: true },
    { id: 'sh2', name: 'Badges Bundle', description: 'Unlock 3 exclusive profile badges', category: 'digital', cost: 200, available: true, emoji: '🏅', popular: true },
    { id: 'sh3', name: 'Extra Break Time', description: '15-minute extra break pass', category: 'privileges', cost: 100, available: true, emoji: '⏰', popular: false },
    { id: 'sh4', name: 'New Avatar', description: 'Unlock a premium profile avatar', category: 'digital', cost: 120, available: true, emoji: '🎭', popular: false },
    { id: 'sh5', name: 'Cafeteria Voucher', description: '10% discount at school cafeteria', category: 'vouchers', cost: 80, available: true, emoji: '🍽️', popular: true },
    { id: 'sh6', name: 'School Pen Set', description: 'Premium pen set from school store', category: 'stationery', cost: 90, available: false, emoji: '🖊️', popular: false },
    { id: 'sh7', name: 'Title: Top Achiever', description: 'Display special title next to name', category: 'digital', cost: 250, available: true, emoji: '👑', popular: true },
    { id: 'sh8', name: 'Music in Class', description: 'Listen to music during study hour', category: 'privileges', cost: 180, available: true, emoji: '🎵', popular: false },
  ];

  private challenges: Challenge[] = [
    { id: 'ch1', name: 'Math Sprint', difficulty: 'medium', deadline: '2025-06-15', rewardPoints: 200, progress: 3, maxProgress: 5, status: 'joined', description: 'Complete 5 timed math quizzes with 90%+ score.' },
    { id: 'ch2', name: 'Reading Marathon', difficulty: 'hard', deadline: '2025-06-20', rewardPoints: 350, progress: 2, maxProgress: 10, status: 'joined', description: 'Read 10 books and submit summary reports.' },
    { id: 'ch3', name: 'Attendance Hero', difficulty: 'easy', deadline: '2025-06-30', rewardPoints: 150, progress: 0, maxProgress: 20, status: 'available', description: 'Achieve 100% attendance for 20 consecutive days.' },
    { id: 'ch4', name: 'Science Explorer', difficulty: 'hard', deadline: '2025-06-18', rewardPoints: 400, progress: 0, maxProgress: 5, status: 'available', description: 'Score 90%+ on 5 science experiments.' },
    { id: 'ch5', name: 'Arabic Excellence', difficulty: 'medium', deadline: '2025-06-25', rewardPoints: 250, progress: 5, maxProgress: 8, status: 'joined', description: 'Complete 8 advanced Arabic writing assignments.' },
    { id: 'ch6', name: 'Perfect Week', difficulty: 'easy', deadline: '2025-06-14', rewardPoints: 100, progress: 4, maxProgress: 5, status: 'joined', description: 'Attend all classes and complete all tasks in one week.' },
  ];

  private badges: Badge[] = [
    { id: 'b1', name: 'First Steps', description: 'Complete your first activity', requirement: 'Complete 1 activity', dateEarned: '2025-01-15', icon: '👣', earned: true, category: 'General' },
    { id: 'b2', name: 'Math Wizard', description: 'Excel in mathematics', requirement: 'Score 95%+ in Math', dateEarned: '2025-03-10', icon: '🧮', earned: true, category: 'Academic' },
    { id: 'b3', name: 'Bookworm', description: 'Love of reading', requirement: 'Complete 15 readings', dateEarned: '2025-04-20', icon: '📖', earned: true, category: 'Academic' },
    { id: 'b4', name: 'Punctual', description: 'Always on time', requirement: '0 late arrivals in month', dateEarned: '2025-05-01', icon: '⏰', earned: true, category: 'Attendance' },
    { id: 'b5', name: 'Team Leader', description: 'Lead group projects', requirement: 'Lead 3 group projects', dateEarned: '', icon: '👥', earned: false, category: 'Social' },
    { id: 'b6', name: 'Science Star', description: 'Excel in sciences', requirement: 'Score 90%+ in Science', dateEarned: '', icon: '🔬', earned: false, category: 'Academic' },
    { id: 'b7', name: 'Challenger', description: 'Complete 10 challenges', requirement: 'Win 10 challenges', dateEarned: '', icon: '⚔️', earned: false, category: 'Challenge' },
    { id: 'b8', name: 'Top of Class', description: 'Rank #1 in your class', requirement: 'Rank 1st for one semester', dateEarned: '', icon: '🥇', earned: false, category: 'Academic' },
    { id: 'b9', name: 'Streak Master', description: '30-day learning streak', requirement: '30 consecutive days', dateEarned: '', icon: '🔥', earned: false, category: 'Attendance' },
  ];

  private notifs: Notification[] = [
    { id: 'n1', title: 'New Grade Posted', body: 'You received 95% on the Math Midterm Exam.', type: 'academic', date: '2025-06-09', read: false },
    { id: 'n2', title: 'Achievement Unlocked!', body: "You earned the 'Perfect Week' badge!", type: 'reward', date: '2025-06-08', read: false },
    { id: 'n3', title: 'Assignment Due Soon', body: 'Science Lab Report is due in 2 days.', type: 'academic', date: '2025-06-08', read: true },
    { id: 'n4', title: 'New Challenge Available', body: 'Join the Math Sprint challenge and win 200 VP!', type: 'reward', date: '2025-06-07', read: true },
    { id: 'n5', title: 'Message from Teacher', body: 'Mr. Khalid sent you a message about your progress.', type: 'message', date: '2025-06-06', read: true },
    { id: 'n6', title: 'System Maintenance', body: 'EduVenture will be down for 30 min on Sunday.', type: 'system', date: '2025-06-05', read: true },
  ];

  private msgs: Message[] = [
    {
      id: 'm1', from: 'Mr. Khalid', initials: 'MK', role: 'Math Teacher', preview: 'Your progress this term is great!', timeAgo: '10 min', unread: true,
      messages: [{ sender: 'Mr. Khalid', text: 'Hi Sara! I wanted to say that your performance in math this term is outstanding.', time: '10:30 AM', mine: false }, { sender: 'You', text: 'Thank you so much, Mr. Khalid! I have been working really hard.', time: '10:32 AM', mine: true }]
    },
    {
      id: 'm2', from: 'Ms. Sara', initials: 'MS', role: 'Homeroom Teacher', preview: "Don't forget tomorrow's assignment.", timeAgo: '2 hrs', unread: true,
      messages: [{ sender: 'Ms. Sara', text: "Reminder: Don't forget to submit your history assignment tomorrow.", time: '8:00 AM', mine: false }]
    },
    {
      id: 'm3', from: 'Mr. Bashar', initials: 'MB', role: 'History Teacher', preview: 'Extended deadline for the project.', timeAgo: 'Yesterday', unread: false,
      messages: [{ sender: 'Mr. Bashar', text: 'The history project deadline has been extended to next Sunday.', time: 'Yesterday', mine: false }]
    },
  ];

  // Progress trends
  gpaTrend = [3.5, 3.6, 3.7, 3.8, 3.85, 3.9];
  attendanceTrend = [90, 92, 88, 95, 97, 97];
  vpGrowth = [200, 450, 750, 1100, 1800, 2500];
  subjectProgress = [
    { subject: 'Math', progress: 95, trend: [78, 83, 88, 92, 95, 95] },
    { subject: 'English', progress: 91, trend: [75, 79, 84, 88, 90, 91] },
    { subject: 'Arabic', progress: 93, trend: [80, 84, 88, 90, 92, 93] },
    { subject: 'Science', progress: 84, trend: [70, 74, 78, 80, 82, 84] },
    { subject: 'History', progress: 88, trend: [76, 80, 83, 85, 87, 88] },
    { subject: 'Physics', progress: 87, trend: [75, 79, 82, 84, 86, 87] },
  ];

  // Public getters
  getActivities(): Observable<Activity[]> { return of(this.activities); }
  getAssignments(): Observable<Assignment[]> { return of(this.assignments); }
  getAttendance(): Observable<AttendanceRecord[]> { return of(this.attendance); }
  getGrades(): Observable<GradeEntry[]> { return this.http.get<GradeEntry[]>(`${this.apiBaseUrl}/api/student/me/grades`); }
  getAchievements(): Observable<Achievement[]> { return this.http.get<{ items: Achievement[] }>(`${this.apiBaseUrl}/api/student/achievements`).pipe(map(res => res.items)); }
  getAchievementLibrary(): Observable<Achievement[]> { return this.http.get<{ items: Achievement[] }>(`${this.apiBaseUrl}/api/student/achievements/library`).pipe(map(res => res.items)); }
  getVPHistory(): Observable<VPEntry[]> { return of(this.vpHistory); }
  getShopItems(): Observable<ShopItem[]> { return of(this.shopItems); }
  getChallenges(): Observable<Challenge[]> { return of(this.challenges); }
  getBadges(): Observable<Badge[]> { return of(this.badges); }
  getNotifications(): Observable<Notification[]> { return of(this.notifs); }
  getMessages(): Observable<Message[]> { return of(this.msgs); }

  get earnedVP(): number { return this.vpHistory.filter(v => v.type === 'earned').reduce((s, v) => s + v.points, 0); }
  get spentVP(): number { return Math.abs(this.vpHistory.filter(v => v.type === 'spent').reduce((s, v) => s + v.points, 0)); }
  get presentDays(): number { return this.attendance.filter(a => a.status === 'present').length; }
  get absentDays(): number { return this.attendance.filter(a => a.status === 'absent').length; }
  get lateDays(): number { return this.attendance.filter(a => a.status === 'late').length; }
}
