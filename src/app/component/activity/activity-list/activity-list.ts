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
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../../activity/services/activity';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-list.html',
  styleUrls: ['./activity-list.css'],
})
export class ActivityListComponent {
  service = inject(ActivityService);

  submissionCount(activityId: string): number {
    return this.service.getSubmissionsForActivity(activityId).length;
  }

  deleteActivity(id: string): void {
    this.service.deleteActivity(id);
  }
}