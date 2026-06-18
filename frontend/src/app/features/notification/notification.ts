import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
import { StudentPortalService } from '../../services/student-portal.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../../shared/admin-topbar/admin-topbar.component';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { AuthService } from '../../shared/services/auth/auth';
import { NotificationService } from '../../shared/services/notifications/notification.service';
import { Notification as AppNotification } from '../../models/notification.model';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    StudentSidebarComponent,
    StudentTopbarComponent,
    SidebarComponent,
    TopbarComponent,
    AdminSidebarComponent,
    AdminTopbarComponent,
    ParentSidebarComponent
  ],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class Notification implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  ps = inject(StudentPortalService);

  role: 'student' | 'teacher' | 'admin' | 'parent' = 'student';
  teacherName = '';
  parentName = '';

  notifications: AppNotification[] = [];
  filteredNotifications: AppNotification[] = [];
  statusFilter: 'all' | 'unread' | 'read' = 'all';
  typeFilter: 'all' | 'message' | 'system' | 'grade' | 'purchase' = 'all';
  loading = true;
  private notifSub?: Subscription;

  async ngOnInit(): Promise<void> {
    try {
      const userRole = await this.authService.getCurrentUserRole();
      this.role = (userRole as any) || 'student';
      if (this.role === 'teacher') {
        const profile = await this.authService.getTeacherProfile();
        if (profile) {
          const firstName = profile.firstName || '';
          const lastName = profile.lastName || '';
          if (firstName || lastName) {
            this.teacherName = `${firstName} ${lastName}`.trim();
          } else if (profile.email) {
            this.teacherName = profile.email.split('@')[0];
          }
        }
      } else if (this.role === 'parent') {
        const profile = await this.authService.getParentProfile();
        if (profile) {
          const firstName = profile.firstName || '';
          const lastName = profile.lastName || '';
          if (firstName || lastName) {
            this.parentName = `${firstName} ${lastName}`.trim();
          } else if (profile.email) {
            this.parentName = profile.email.split('@')[0];
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load profile for notifications component', err);
    }

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    if (this.notifSub) {
      this.notifSub.unsubscribe();
    }
  }

  private loadNotifications(): void {
    const uid = this.notifService.currentUserId;
    if (!uid) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.notifSub = this.notifService.getNotifications(uid).subscribe({
      next: (data) => {
        this.notifications = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching notifications:', error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setStatusFilter(status: 'all' | 'unread' | 'read'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  setTypeFilter(type: 'all' | 'message' | 'system' | 'grade' | 'purchase'): void {
    this.typeFilter = type;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(n => {
      // Status filter
      if (this.statusFilter === 'unread' && n.isRead) return false;
      if (this.statusFilter === 'read' && !n.isRead) return false;

      // Type filter
      if (this.typeFilter !== 'all' && n.type !== this.typeFilter) return false;

      return true;
    });
  }

  async handleNotificationClick(n: AppNotification): Promise<void> {
    console.log('Notification clicked:', n);
    
    if (!n.isRead && n.id) {
      const uid = this.notifService.currentUserId;
      if (uid) {
        try {
          await this.notifService.markAsRead(uid, n.id);
          console.log('Notification marked as read:', n.id);
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
        }
      }
    }

    // Redirect based on type
    let route = '';
    let queryParams: any = {};
    if (n.type === 'message') {
      if (this.role === 'student') route = '/student-messages';
      else if (this.role === 'teacher') route = '/teacher-messages';
      else if (this.role === 'parent') route = '/parent-messages';
      else if (this.role === 'admin') route = '/admin-messages';
      
      if (n.relatedId) {
        queryParams = { contactId: n.relatedId };
      }
    } else if (n.type === 'grade') {
      if (this.role === 'student') route = '/studentactivities';
      else if (this.role === 'parent') route = '/parent-grades';
      else if (this.role === 'teacher') route = '/gradebook';
    } else if (n.type === 'purchase') {
      if (this.role === 'student') route = '/venture-shop';
      else if (this.role === 'admin') route = '/admin-venture-shop';
    }

    console.log('Redirecting to:', route, 'with queryParams:', queryParams);

    if (route) {
      try {
        await this.router.navigate([route], { queryParams });
      } catch (err) {
        console.error('Navigation failed:', err);
      }
    }
  }

  async markAsRead(n: AppNotification, event: Event): Promise<void> {
    event.stopPropagation();
    if (!n.id) return;
    const uid = this.notifService.currentUserId;
    if (uid) {
      await this.notifService.markAsRead(uid, n.id);
    }
  }

  async markAllAsRead(): Promise<void> {
    const uid = this.notifService.currentUserId;
    if (uid) {
      await this.notifService.markAllAsRead(uid);
    }
  }

  formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  get groupedNotifications() {
    const groups: { [key: string]: AppNotification[] } = {
      'Today': [],
      'Yesterday': [],
      'Older': []
    };

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    this.filteredNotifications.forEach(n => {
      const dateStr = new Date(n.timestamp).toDateString();
      if (dateStr === todayStr) {
        groups['Today'].push(n);
      } else if (dateStr === yesterdayStr) {
        groups['Yesterday'].push(n);
      } else {
        groups['Older'].push(n);
      }
    });

    return Object.keys(groups)
      .map(key => ({ title: key, items: groups[key] }))
      .filter(g => g.items.length > 0);
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  get totalCount(): number {
    return this.notifications.length;
  }
}

