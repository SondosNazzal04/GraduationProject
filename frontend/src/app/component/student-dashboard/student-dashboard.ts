import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../shared/services/auth/auth';
import { getApiBaseUrl } from '../../firebase.runtime-config';

interface StudentProfile {
  uid: string;
  email: string;
  pointsBalance: number;
  classIds: string[];
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
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentDashboard implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${getApiBaseUrl()}/api`;

  profile: StudentProfile | null = null;
  classes: SchoolClass[] = [];
  attendance: AttendanceRecord[] = [];
  loading = true;
  error = '';

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/student-dashboard' },
    { label: 'Activities', icon: 'assignment', route: '/studentactivities' },
    { label: 'My Classes', icon: 'class', route: '/my-classes' },
    { label: 'Attendance', icon: 'event_available', route: '/attendance' },
    { label: 'Grades', icon: 'grade', route: '/gradebook' },
    { label: 'Shop', icon: 'storefront', route: '/venture-shop' },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      // Fetch student profile (points + classIds)
      const profileData = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/student/me`)
      );
      this.profile = profileData;

      // Fetch enrolled classes
      const classesData = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/student/me/classes`)
      );
      this.classes = Array.isArray(classesData.items) ? classesData.items : [];

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
}