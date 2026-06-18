// // activity-list.component.ts
// import { Component, inject } from '@angular/core';
// import { RouterLink } from '@angular/router';
// import { CommonModule } from '@angular/common';
// // لاحظي استخدمنا اسم الملف 'activity' فقط بدون .ts
// import { ActivityService } from '../../../activity/services/activity';
//  import { Activity } from '../../../models/activity';

// @Component({
//   selector: 'app-activity-list',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   template: `
//     <h2>Activities</h2>
//     <a routerLink="/activities/create">+ Create activity</a>

//     <div *ngFor="let a of service.activities$()" class="activity-card">
//       <h3>{{ a.title }}</h3>
//       <p>{{ a.type }} · {{ a.questions.length }} questions</p>
//       <a [routerLink]="['/activities', a.id, 'submissions']">
//         View submissions ({{ submissionCount(a.id) }})
//       </a>
//     </div>

//     <p *ngIf="service.activities$().length === 0">No activities yet.</p>
//   `
// })
// export class ActivityListComponent {
//   service = inject(ActivityService);

//   submissionCount(activityId: string): number {
//     return this.service.getSubmissionsForActivity(activityId).length;
//   }
// }
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../../activity/services/activity';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AuthService } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './activity-list.html',
  styleUrls: ['./activity-list.css'],
})
export class ActivityListComponent implements OnInit {
  service = inject(ActivityService);
  private authService = inject(AuthService);

  teacherName = 'Mr. Smith';

  ngOnInit(): void {
    this.loadProfile();
  }

  getSubmissionCount(activityId: string): number {
    return this.service.getSubmissionsForActivity(activityId).length;
  }

  trackById(index: number, activity: any): string {
    return activity.id;
  }

  formatDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    // Firestore Timestamp object
    if (typeof value === 'object' && typeof value._seconds === 'number') {
      return new Date(value._seconds * 1000);
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  deleteActivity(id: string): void {
    this.service.deleteActivity(id);
  }

  private loadProfile(): void {
    this.authService.getTeacherProfile().then(profile => {
      if (profile) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        if (firstName || lastName) {
          this.teacherName = `${firstName} ${lastName}`.trim();
        } else if (profile.email) {
          this.teacherName = profile.email.split('@')[0];
        }
      }
    }).catch(err => {
      console.warn('Failed to load teacher profile', err);
    });
  }
}

