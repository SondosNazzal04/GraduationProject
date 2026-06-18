import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../shared/services/auth/auth';
import { getApiBaseUrl } from '../../firebase.runtime-config';

// Import new UI components and services
import { StudentPortalService, Activity, Assignment, Achievement, Notification } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';

interface StudentProfile {
  uid: string;
  email: string;
  pointsBalance: number;
  classIds: string[];
  firstName?: string;
  lastName?: string;
}

interface SchoolClass {
  id: string;
  name: string;
  code?: string;
  gradeLevel?: string;
  description?: string;
  teacherUid?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  classId: string;
  className?: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss',
})
export class StudentDashboard implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  public ps = inject(StudentPortalService);
  private baseUrl = `${getApiBaseUrl()}/api`;

  realProfile: StudentProfile | null = null;
  classes: SchoolClass[] = [];
  attendance: AttendanceRecord[] = [];
  loading = true;
  error = '';

  activities    = signal<Activity[]>([]);
  assignments   = signal<any[]>([]);
  achievements  = signal<Achievement[]>([]);

  // Provide the profile data to the template. Start with the beautiful mock design,
  // but override it with real user data once loaded.
  get prof() { 
    const mock = this.ps.profile();
    if (this.realProfile) {
      const fName = this.realProfile.firstName || '_';
      const lName = this.realProfile.lastName || '_';
      return {
        ...mock,
        name: `${fName} ${lName}`,
        initials: `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase(),
        venturePoints: this.realProfile.pointsBalance,
        attendancePct: this.getAttendanceRate() > 0 ? this.getAttendanceRate() : '_',
        streak: '_',
        completedActivities: '_',
        badgesEarned: '_',
        gpa: '_',
      };
    }
    return mock;
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();

    // Load mock data for the dashboard widgets that don't have real data yet
    this.ps.getActivities().subscribe(a => this.activities.set(a.slice(0, 4)));
    this.ps.getAchievements().subscribe(a => this.achievements.set(a.filter(x => x.earned).slice(0, 4)));
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      // Fetch student profile
      const profileData = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/student/me`)
      );
      this.realProfile = profileData;

      // Fetch enrolled classes
      const classesData = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/student/me/classes`)
      );
      this.classes = Array.isArray(classesData.items) ? classesData.items : [];

      // Fetch real activities/assignments
      const activitiesData = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/activities`)
      );
      const realActivities = Array.isArray(activitiesData.items) ? activitiesData.items : [];
      
      const mappedAssignments = realActivities.map((act: any) => ({
        id: act.id,
        name: act.title || '_',
        subject: this.classes.find(c => c.id === act.classId)?.name || '_',
        dueDate: '_',
        status: '_'
      }));
      this.assignments.set(mappedAssignments);

    } catch (err) {
      this.error = 'Failed to load your dashboard. Please try again.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  getAttendanceRate(): number {
    if (!this.attendance.length) return 0;
    const present = this.attendance.filter(r => r.status === 'present').length;
    return Math.round((present / this.attendance.length) * 100);
  }

  barH(v: number, max: number): number { return (v / max) * 72; }

  gc(p: number): string {
    return p >= 90 ? '#22c55e' : p >= 75 ? '#f59e0b' : '#ef4444';
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      completed: 'chip--green', in_progress: 'chip--blue',
      not_started: 'chip--amber', pending: 'chip--amber',
      submitted: 'chip--blue', graded: 'chip--green', late: 'chip--red'
    };
    return m[s] || 'chip--amber';
  }

  diffClass(d: string): string {
    return d === 'easy' ? 'chip--green' : d === 'medium' ? 'chip--amber' : 'chip--red';
  }
}

