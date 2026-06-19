import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentPortalService, Achievement } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';

@Component({
  selector: 'app-student-achievements',
  standalone: true,
  imports: [CommonModule, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './student-achievements.html',
  styleUrl: './student-achievements.scss'
})
export class StudentAchievementsComponent implements OnInit {
  private portalService = inject(StudentPortalService);

  achievements: Achievement[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.portalService.getAchievements().subscribe({
      next: (data) => {
        this.achievements = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load achievements', err);
        this.loading = false;
      }
    });
  }

  get badges() {
    return this.achievements.filter(a => a.type === 'badge');
  }

  get streaks() {
    return this.achievements.filter(a => a.type === 'streak');
  }

  get others() {
    return this.achievements.filter(a => a.type !== 'badge' && a.type !== 'streak');
  }
}
