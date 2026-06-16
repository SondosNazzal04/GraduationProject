import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../activity/services/activity';
import { Activity, Submission } from '../../../models/activity';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AuthService } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-submissions',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, TopbarComponent],
  templateUrl: './submissions.html',
  styleUrls: ['./submissions.scss'],
})
export class SubmissionsComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  service         = inject(ActivityService);
  private authService = inject(AuthService);

  activity: Activity | undefined;
  submissions: Submission[] = [];
  expandedId: string | null = null;
  teacherName = 'Mr. Smith';

  ngOnInit(): void {
    this.loadProfile();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.activity    = this.service.getActivity(id);
    this.submissions = this.service.getSubmissionsForActivity(id);
  }

  toggle(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getQuestionText(questionId: string): string {
    return this.activity?.questions.find(q => q.id === questionId)?.text ?? questionId;
  }

  averageGrade(): number {
    const graded = this.submissions.filter(s => s.grade !== undefined);
    if (!graded.length) return 0;
    return Math.round(graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length);
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