import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../firebase.runtime-config';

interface ChildStudent {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  pointsBalance: number;
}

@Component({
  selector: 'app-parent-children',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './parent-children.html',
  styleUrl: './parent-children.css',
})
export class ParentChildren implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;

  children: ChildStudent[] = [];
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
    await this.loadChildren();
  }

  async loadChildren(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const data = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/parent/me/children`)
      );
      this.children = Array.isArray(data.items) ? data.items : [];
    } catch (err) {
      this.error = 'Failed to load children details. Please try again.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
