import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ActivityService } from '../../../activity/services/activity';

@Component({
  selector: 'app-teacher-dachboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './teacher-dachboard.html',
  styleUrl: './teacher-dachboard.css',
})
export class TeacherDachboard {
  private service = inject(ActivityService);

  recentSubmissions = computed(() => {
    return this.service
      .submissions$()
      .map((submission) => ({
        ...submission,
        activityTitle:
          this.service.getActivity(submission.activityId)?.title || 'Activity submission',
        initials: this.getInitials(submission.studentName),
        status: submission.gradePercentage !== undefined ? 'graded' : 'pending',
        submittedAtLabel: this.timeAgo(submission.submittedAt),
      }))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
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

  private timeAgo(value: string | Date): string {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}
