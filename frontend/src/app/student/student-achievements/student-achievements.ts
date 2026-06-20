import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';
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
  private cdr = inject(ChangeDetectorRef);

  achievements: Achievement[] = [];
  availableAchievements: Achievement[] = [];
  loading = false;
  activeTab: 'earned' | 'available' = 'available';

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      earned: this.portalService.getAchievements(),
      library: this.portalService.getAchievementLibrary()
    }).subscribe({
      next: ({ earned, library }) => {
        this.achievements = earned;
        
        // Find which achievements in library are NOT earned yet
        const earnedIds = new Set(earned.map(a => (a as any).achievementId || a.id));
        this.availableAchievements = library.filter(libItem => !earnedIds.has(libItem.id));
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load achievements', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get badges() {
    const list = this.activeTab === 'earned' ? this.achievements : this.availableAchievements;
    return list.filter(a => a.type === 'badge');
  }

  get streaks() {
    const list = this.activeTab === 'earned' ? this.achievements : this.availableAchievements;
    return list.filter(a => a.type === 'streak');
  }

  get others() {
    const list = this.activeTab === 'earned' ? this.achievements : this.availableAchievements;
    return list.filter(a => a.type !== 'badge' && a.type !== 'streak');
  }
}
