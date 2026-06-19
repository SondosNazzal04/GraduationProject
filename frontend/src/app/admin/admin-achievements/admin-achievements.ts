import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../firebase.runtime-config';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../../shared/admin-topbar/admin-topbar.component';

export interface AchievementLibraryItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'badge' | 'streak' | 'challenge' | 'award';
  maxProgress: number;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  role: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-admin-achievements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminSidebarComponent, AdminTopbarComponent],
  templateUrl: './admin-achievements.html',
  styleUrl: './admin-achievements.scss',
})
export class AdminAchievementsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private baseUrl = `${getApiBaseUrl()}/api`;

  achievements: AchievementLibraryItem[] = [];
  students: AdminUser[] = [];
  
  loading = false;
  submitting = false;
  message = '';
  error = '';
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  createForm = {
    title: '',
    description: '',
    icon: '🏆',
    type: 'badge' as const,
  };

  showAwardModal = false;
  selectedAchievement: AchievementLibraryItem | null = null;
  awardForm = {
    studentUid: '',
  };

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [achievementsJson, usersJson] = await Promise.all([
        firstValueFrom<any>(this.http.get(`${this.baseUrl}/admin/achievements/library`)),
        firstValueFrom<any>(this.http.get(`${this.baseUrl}/admin/users`)),
      ]);

      this.achievements = Array.isArray(achievementsJson.items) ? achievementsJson.items : [];
      
      const allUsers = Array.isArray(usersJson.items) ? usersJson.items : [];
      this.students = allUsers.filter((u: AdminUser) => u.role === 'student');

    } catch (err) {
      this.error = 'Failed to load achievements data.';
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async createAchievement(): Promise<void> {
    this.clearMessages();
    if (!this.createForm.title.trim() || !this.createForm.description.trim() || !this.createForm.icon.trim()) {
      this.error = 'Title, description, and icon are required.';
      return;
    }

    this.submitting = true;
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/admin/achievements/library`, {
          title: this.createForm.title.trim(),
          description: this.createForm.description.trim(),
          icon: this.createForm.icon.trim(),
          type: this.createForm.type,
          maxProgress: 1,
        })
      );

      this.showSuccess('Achievement created successfully.');
      this.createForm = { title: '', description: '', icon: '🏆', type: 'badge' };
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to create achievement.';
      console.error(err);
    } finally {
      this.submitting = false;
    }
  }

  async deleteAchievement(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this achievement definition? It will no longer be available to award.')) {
      return;
    }
    
    this.clearMessages();
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/admin/achievements/library/${id}`));
      this.showSuccess('Achievement deleted successfully.');
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to delete achievement.';
      console.error(err);
    }
  }

  openAwardModal(achievement: AchievementLibraryItem): void {
    this.selectedAchievement = achievement;
    this.awardForm.studentUid = '';
    this.showAwardModal = true;
  }

  closeAwardModal(): void {
    this.showAwardModal = false;
    this.selectedAchievement = null;
  }

  async awardAchievement(): Promise<void> {
    if (!this.selectedAchievement || !this.awardForm.studentUid) {
      this.error = 'Please select a student.';
      return;
    }

    this.clearMessages();
    this.submitting = true;
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/teacher/achievements/award`, {
          achievementId: this.selectedAchievement.id,
          studentUid: this.awardForm.studentUid,
        })
      );

      this.showSuccess('Achievement awarded successfully!');
      this.closeAwardModal();
    } catch (err) {
      this.error = 'Failed to award achievement.';
      console.error(err);
    } finally {
      this.submitting = false;
    }
  }

  getStudentLabel(student: AdminUser): string {
    const name = [student.firstName, student.lastName].filter(Boolean).join(' ');
    return name ? `${name} (${student.email})` : student.email || 'Unknown Student';
  }

  private clearMessages(): void {
    this.message = '';
    this.error = '';
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
  }

  private showSuccess(msg: string): void {
    this.message = msg;
    this.error = '';
    this.messageTimer = setTimeout(() => {
      this.message = '';
    }, 6000);
  }
}
