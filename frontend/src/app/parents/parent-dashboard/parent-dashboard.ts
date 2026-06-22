import { Component, OnInit, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../firebase.runtime-config';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ParentService, ParentChild, SchoolEvent } from '../../services/parent.service';

interface ParentProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    RouterModule,
    RouterLink,
    ParentSidebarComponent,
    TopbarComponent
  ],
  templateUrl: './parent-dashboard.html',
  styleUrls: ['./parent-dashboard.scss'],
})
export class ParentDashboard implements OnInit {
  private http = inject(HttpClient);
  private parentService = inject(ParentService);
  private baseUrl = `${getApiBaseUrl()}/api`;
  private cdr = inject(ChangeDetectorRef);

  profile: ParentProfile | null = null;
  loading = true;
  error = '';

  children = signal<ParentChild[]>([]);
  events = signal<SchoolEvent[]>([]);
  selectedId = signal('');

  recentActivity = signal<any[]>([
    {
      icon: 'assignment',
      color: '#1565C0',
      bg: '#e3f2fd',
      text: 'Submitted Math Homework',
      child: 'Child 1',
      time: '2 hours ago',
    },
    {
      icon: 'grade',
      color: '#388e3c',
      bg: '#e8f5e9',
      text: 'Received Grade A in Science',
      child: 'Child 2',
      time: '1 day ago',
    },
    {
      icon: 'attend',
      color: '#f57c00',
      bg: '#fff3e0',
      text: 'Attendance marked Present',
      child: 'Child 1',
      time: '2 days ago',
    },
  ]);

  attendanceTrend = [
    { month: 'Jan', pct: 92 }, { month: 'Feb', pct: 95 }, { month: 'Mar', pct: 88 },
    { month: 'Apr', pct: 97 }, { month: 'May', pct: 98 }, { month: 'Jun', pct: 95 },
  ];
  maxTrend = 100;

  ngOnInit() {
    this.loadData();
    this.parentService.getChildren().subscribe(c => {
      this.children.set(c);
      if (c.length && !this.selectedId()) {
        this.selectedId.set(c[0].id);
      }
    });
    this.parentService.getEvents().subscribe(e => this.events.set(e));
  }

  private timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    for (const i in intervals) {
      const interval = Math.floor(seconds / intervals[i]);
      if (interval >= 1) {
        return `${interval} ${i}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
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
      this.cdr.detectChanges();
    }
  }

  get parentName(): string {
    if (this.profile) {
      const firstName = this.profile.firstName || '';
      const lastName = this.profile.lastName || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return this.profile.email ? this.profile.email.split('@')[0] : 'Parent';
    }
    return 'Parent';
  }

  get selected(): ParentChild | undefined {
    return this.children().find(c => c.id === this.selectedId());
  }

  get avgGpa(): number {
    const ch = this.children();
    if (!ch.length) return 0;
    return Math.round((ch.reduce((s, c) => s + c.gpa, 0) / ch.length) * 10) / 10;
  }

  get avgAttendance(): number {
    const ch = this.children();
    if (!ch.length) return 0;
    return Math.round(ch.reduce((s, c) => s + c.attendancePct, 0) / ch.length);
  }

  get totalVP(): number {
    return this.children().reduce((s, c) => s + c.venturePoints, 0);
  }

  getGpaColor(gpa: number): string {
    return gpa >= 90 ? '#22c55e' : gpa >= 75 ? '#f59e0b' : '#ef4444';
  }

  barHeight(pct: number): number { return (pct / this.maxTrend) * 80; }
}