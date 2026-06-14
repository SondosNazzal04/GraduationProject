import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ActivityService } from '../../activity/services/activity';
import { StudentPortalService } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
import { getApiBaseUrl } from '../../firebase.runtime-config';

@Component({
  selector: 'app-student-activities',
  standalone: true,
  imports: [CommonModule, RouterLink, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './student-activities.html',
  styleUrls: ['./student-activities.css'],
})
export class StudentActivitiesComponent implements OnInit {
  service = inject(ActivityService);
  studentService = inject(StudentPortalService);
  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;

  realProfile: any = null;

  async ngOnInit(): Promise<void> {
    try {
      this.realProfile = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/student/me`)
      );
    } catch (e) {
      console.error(e);
    }
  }

  get prof() {
    const mock = this.studentService.profile();
    if (this.realProfile) {
      const fName = this.realProfile.firstName || '_';
      const lName = this.realProfile.lastName || '_';
      return {
        ...mock,
        name: `${fName} ${lName}`,
        venturePoints: this.realProfile.pointsBalance,
      };
    }
    return mock;
  }

  // ★ بيقرأ من localStorage مباشرة ★
  hasSubmitted(activityId: string): boolean {
    const submittedList: string[] = JSON.parse(
      localStorage.getItem('submittedActivities') || '[]'
    );
    return submittedList.includes(activityId);
  }
}