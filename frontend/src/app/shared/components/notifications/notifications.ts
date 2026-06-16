import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notifications/notification.service';
import { Notification } from '../../../models/notification.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private auth = inject(Auth);

  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  private sub?: Subscription;
  private authUnsubscribe?: () => void;

  ngOnInit() {
    this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
      if (this.sub) {
        this.sub.unsubscribe();
      }
      if (user) {
        this.sub = this.notificationService.getNotifications(user.uid).subscribe(notifs => {
          this.notifications = notifs;
          this.unreadCount = notifs.filter(n => !n.isRead).length;
        });
      } else {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  async markAsRead(notif: Notification) {
    if (!notif.isRead && this.notificationService.currentUserId) {
      await this.notificationService.markAsRead(this.notificationService.currentUserId, notif.id!);
    }
  }

  async markAllAsRead() {
    if (this.notificationService.currentUserId) {
      await this.notificationService.markAllAsRead(this.notificationService.currentUserId);
    }
  }

  async onNotificationClick(notif: Notification) {
    await this.markAsRead(notif);
    this.closeDropdown();
    
    try {
      const role = await this.authService.getCurrentUserRole();
      let route = '';
      let queryParams: any = {};
      
      if (notif.type === 'message') {
        if (role === 'student') route = '/student-messages';
        else if (role === 'teacher') route = '/teacher-messages';
        else if (role === 'parent') route = '/parent-messages';
        else if (role === 'admin') route = '/admin-messages';
        
        if (notif.relatedId) {
          queryParams = { contactId: notif.relatedId };
        }
      } else if (notif.type === 'grade') {
        if (role === 'student') route = '/studentactivities';
        else if (role === 'parent') route = '/parent-grades';
        else if (role === 'teacher') route = '/gradebook';
      } else if (notif.type === 'purchase') {
        if (role === 'student') route = '/venture-shop';
        else if (role === 'admin') route = '/admin-venture-shop';
      }

      if (route) {
        await this.router.navigate([route], { queryParams });
      }
    } catch (err) {
      console.error('Failed to handle notification click navigation:', err);
    }
  }
}
