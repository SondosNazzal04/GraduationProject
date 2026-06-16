import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../activity/services/activity';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { AuthService } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-teacher-dachboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './teacher-dachboard.html',
  styleUrl: './teacher-dachboard.css',
})
export class TeacherDachboard implements OnInit {
  private service = inject(ActivityService);
  private authService = inject(AuthService);

  teacherName = signal<string>('Mr. Smith');

  ngOnInit(): void {
    void this.service.syncFromBackend();
    this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    try {
      const profile = await this.authService.getTeacherProfile();
      if (profile) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        if (firstName || lastName) {
          this.teacherName.set(`${firstName} ${lastName}`.trim());
        } else if (profile.email) {
          this.teacherName.set(profile.email.split('@')[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load teacher profile', err);
    }
  }

  selectedGrades: { [key: string]: string } = {};

  toggleGrade(item: any): void {
    if (this.selectedGrades[item.id]) {
      delete this.selectedGrades[item.id];
    } else {
      const gradeText = item.gradePercentage !== undefined 
        ? `${item.gradePercentage}%` 
        : item.gradeScore !== undefined
          ? `${item.gradeScore}/${item.totalPoints || 100}`
          : 'Graded';
      this.selectedGrades[item.id] = gradeText;
    }
  }

  recentSubmissions = computed(() => {
    return this.service
      .submissions$()
      .map((submission) => {
        const date = this.parseDate(submission.submittedAt);
        return {
          ...submission,
          activityTitle:
            this.service.getActivity(submission.activityId)?.title || 'Activity submission',
          initials: this.getInitials(submission.studentName || ''),
          status: submission.gradePercentage !== undefined ? 'graded' : 'pending',
          submittedAtDate: date,
          submittedAtLabel: this.timeAgo(date),
        };
      })
      .sort((a, b) => b.submittedAtDate.getTime() - a.submittedAtDate.getTime())
      .slice(0, 4);
  });

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() || '')
      .slice(0, 2)
      .join('');
  }

  private parseDate(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value._seconds === 'number') {
      return new Date(value._seconds * 1000);
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
    return new Date(value);
  }

  private timeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}
