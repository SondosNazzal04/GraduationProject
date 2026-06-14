import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../services/notifications/notification.service';

@Component({
  selector: 'app-student-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student-topbar.component.html',
  styleUrls: ['./student-topbar.component.scss']
})
export class StudentTopbarComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationService);
  private notifSub?: Subscription;

  @Input() pageTitle = '';
  @Input() studentName = 'Sara Ahmad';
  @Input() level = 12;
  @Input() venturePoints = 2500;
  
  notifCount = 0;
  searchQuery = '';

  ngOnInit() {
    const uid = this.notifService.currentUserId;
    if (uid) {
      this.notifSub = this.notifService.getNotifications(uid).subscribe(notifications => {
        this.notifCount = notifications.filter(n => !n.isRead).length;
      });
    }
  }

  ngOnDestroy() {
    if (this.notifSub) this.notifSub.unsubscribe();
  }

  get initials(): string {
    if (!this.studentName || this.studentName === '_ _') return '_';
    const parts = this.studentName.split(' ').filter(p => p && p !== '_');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return '_';
  }
}
