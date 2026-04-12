import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../activity/services/activity';

@Component({
  selector: 'app-student-activities',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-activities.html',
})
export class StudentActivitiesComponent {
  service = inject(ActivityService);
}