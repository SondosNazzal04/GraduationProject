import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../firebase.runtime-config';

interface ParentProfile {
  uid: string;
  email: string;
  classIds: string[];
}

interface SchoolClass {
  id: string;
  name: string;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './parent-dashboard.html',
  styleUrl: './parent-dashboard.css',
})
export class ParentDashboard implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;

  profile: ParentProfile | null = null;
  classes: SchoolClass[] = [];
  loading = true;
  error = '';

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/parent-dashboard' },
    { label: 'Children', icon: 'child_care', route: '/parent-children' },
    { label: 'Attendance', icon: 'event_available', route: '/parent-attendance' },
    { label: 'Grades', icon: 'grade', route: '/parent-grades' },
    { label: 'Classes', icon: 'class', route: '/parent-classes' },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const profileData = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/parent/me`)
      );
      this.profile = profileData;
    } catch (err) {
      this.error = 'Failed to load dashboard. Please try again.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  className(classId: string): string {
    return this.classes.find(c => c.id === classId)?.name || classId;
  }
}