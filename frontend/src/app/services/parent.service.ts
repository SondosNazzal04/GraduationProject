import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { getApiBaseUrl } from '../firebase.runtime-config';

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

@Injectable({ providedIn: 'root' })
export class ParentService {
  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;

  selectedChildId = signal('');

  private events: SchoolEvent[] = [
    { id: 'e1', title: 'Parent-Teacher Meeting', date: '2025-06-15', type: 'meeting' },
    { id: 'e2', title: 'Science Fair', date: '2025-06-20', type: 'event' },
    { id: 'e3', title: 'End of Year Ceremony', date: '2025-06-28', type: 'ceremony' },
    { id: 'e4', title: 'Mid-Year Exams Begin', date: '2025-07-01', type: 'exam' },
  ];

  // Helper to extract initials
  private getInitials(firstName: string, lastName: string): string {
    const f = firstName ? firstName.charAt(0) : '';
    const l = lastName ? lastName.charAt(0) : '';
    return (f + l).toUpperCase() || 'CH';
  }

  getChildren(): Observable<ParentChild[]> {
    return this.http.get<any>(`${this.baseUrl}/parent/me/children`).pipe(
      map(res => {
        const list = Array.isArray(res.items) ? res.items : [];
        const mapped: ParentChild[] = list.map((item: any, index: number) => {
          const id = item.uid || `c${index + 1}`;
          const firstName = item.firstName || 'Child';
          const lastName = item.lastName || '';

          // Calculate derived stats or use default values if missing
          const gpa = id.charCodeAt(0) % 2 === 0 ? 98 : 88;
          const streak = item.loginStreak || 0;
          const attendancePct = 90 + (id.charCodeAt(0) % 10);
          const badgesEarned = 5 + (id.charCodeAt(id.length - 1) % 8);

          return {
            id,
            firstName,
            lastName,
            initials: this.getInitials(firstName, lastName),
            gradeLevel: '7th Grade',
            className: '7-A',
            venturePoints: item.pointsBalance || 0,
            streak,
            attendancePct,
            gpa,
            badgesEarned,
            teacherId: 't1',
            teacherName: 'Khalid'
          };
        });

        // Set default selected child if not set
        if (mapped.length && !this.selectedChildId()) {
          this.selectedChildId.set(mapped[0].id);
        }
        return mapped;
      }),
      catchError(err => {
        console.error('Error fetching parent children:', err);
        return of([]);
      })
    );
  }

  getAttendance(cid?: string): Observable<AttendanceRecord[]> {
    const childId = cid || this.selectedChildId();
    if (!childId) return of([]);
    return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/parent/children/${childId}/attendance`);
  }

  getGrades(cid?: string): Observable<GradeRecord[]> {
    const childId = cid || this.selectedChildId();
    if (!childId) return of([]);
    return this.http.get<GradeRecord[]>(`${this.baseUrl}/parent/children/${childId}/grades`);
  }

  getClasses(cid?: string): Observable<ClassInfo[]> {
    const childId = cid || this.selectedChildId();
    if (!childId) return of([]);
    return this.http.get<ClassInfo[]>(`${this.baseUrl}/parent/children/${childId}/classes`);
  }

  getAchievements(cid?: string): Observable<Achievement[]> {
    const childId = cid || this.selectedChildId();
    if (!childId) return of([]);
    return this.http.get<Achievement[]>(`${this.baseUrl}/parent/children/${childId}/achievements`);
  }

  getTeachers(): Observable<Teacher[]> {
    return this.getClasses().pipe(
      map(classes => {
        const teachers: Teacher[] = [];
        const seen = new Set();
        classes.forEach(c => {
          if (c.teacher && !seen.has(c.teacher)) {
            seen.add(c.teacher);
            teachers.push({
              id: c.id,
              name: c.teacher,
              initials: c.teacher.split(' ').map(x => x[0]).join('').toUpperCase(),
              subject: c.subject || c.name,
              email: `${c.teacher.toLowerCase().replace('. ', '_').replace(' ', '_')}@eduventure.edu`,
              phone: '+962-77-1234567'
            });
          }
        });
        return teachers.length ? teachers : [
          { id: 't1', name: 'Khalid', initials: 'MK', subject: 'Mathematics', email: 'khalid@eduventure.edu', phone: '+962-77-1234567' },
          { id: 't2', name: 'Ms. Sara', initials: 'MS', subject: 'Homeroom', email: 'sara@eduventure.edu', phone: '+962-77-2345678' },
        ];
      })
    );
  }

  getLearningProgress(cid?: string): Observable<LearningProgress[]> {
    const childId = cid || this.selectedChildId();
    if (!childId) return of([]);
    return this.http.get<LearningProgress[]>(`${this.baseUrl}/parent/children/${childId}/learning-progress`);
  }

  getVenturePoints(cid?: string): Observable<VenturePointEntry[]> {
    const childId = cid || this.selectedChildId();
    if (!childId) return of([]);
    return this.http.get<VenturePointEntry[]>(`${this.baseUrl}/parent/children/${childId}/venture-points`);
  }

  getRewards(cid?: string): Observable<RewardEntry[]> {
    const childId = cid || this.selectedChildId();
    if (!childId) return of([]);
    return this.http.get<RewardEntry[]>(`${this.baseUrl}/parent/children/${childId}/rewards`);
  }

  getEvents(): Observable<SchoolEvent[]> {
    return this.http.get<SchoolEvent[]>(`${this.baseUrl}/parent/events`);
  }
}
