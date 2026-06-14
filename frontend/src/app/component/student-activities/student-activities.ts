import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../activity/services/activity';
import { StudentPortalService } from '../../services/student-portal.service';

@Component({
  selector: 'app-student-activities',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-activities.html',
  styleUrls: ['./student-activities.css'],
})
export class StudentActivitiesComponent {
  service = inject(ActivityService);
  studentService = inject(StudentPortalService);

  // ★ بيقرأ من localStorage مباشرة ★
  hasSubmitted(activityId: string): boolean {
    const submittedList: string[] = JSON.parse(
      localStorage.getItem('submittedActivities') || '[]'
    );
    return submittedList.includes(activityId);
  }
}