import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentPortalService, Activity, Assignment, Achievement, Notification } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  activities    = signal<Activity[]>([]);
  assignments   = signal<Assignment[]>([]);
  achievements  = signal<Achievement[]>([]);
  notifications = signal<Notification[]>([]);

  dailyChallenges = [
    { title: 'Solve 5 math problems', points: 25, done: false, icon: '📐' },
    { title: 'Read 10 pages',         points: 20, done: true,  icon: '📖' },
    { title: 'Submit one assignment', points: 30, done: false, icon: '📝' },
    { title: 'Attend all classes',    points: 15, done: true,  icon: '✅' },
  ];

  constructor(public ps: StudentPortalService) {}

  ngOnInit() {
    this.ps.getActivities().subscribe(a => this.activities.set(a.slice(0, 4)));
    this.ps.getAssignments().subscribe(a => this.assignments.set(a.filter(x => x.status === 'pending' || x.status === 'late').slice(0, 4)));
    this.ps.getAchievements().subscribe(a => this.achievements.set(a.filter(x => x.earned).slice(0, 4)));
    this.ps.getNotifications().subscribe(n => this.notifications.set(n.slice(0, 4)));
  }

  get prof() { return this.ps.profile(); }

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
