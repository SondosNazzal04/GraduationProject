import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notifications/notification.service';
import { Notification } from '../../../models/notification.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

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

  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  private sub?: Subscription;

  ngOnInit() {
    const userId = this.notificationService.currentUserId;
    if (userId) {
      this.sub = this.notificationService.getNotifications(userId).subscribe(notifs => {
        this.notifications = notifs;
        this.unreadCount = notifs.filter(n => !n.isRead).length;
      });
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
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

  onNotificationClick(notif: Notification) {
    this.markAsRead(notif);
    this.closeDropdown();
    // Example routing based on type
    if (notif.type === 'message') {
      // route to messages
      // We could try to read relatedId or just route to the common message portal
      // Actually we'll need role checking or we just let them figure it out
      // For now we'll route to student-messages if they are student, etc. but let's just emit event or do simple routing
      if (window.location.pathname.includes('student')) {
        this.router.navigate(['/student-messages']);
      }
    }
  }
}
