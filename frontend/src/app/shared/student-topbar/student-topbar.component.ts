import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../services/notifications/notification.service';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-student-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student-topbar.component.html',
  styleUrls: ['./student-topbar.component.css']
})
export class StudentTopbarComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationService);
  private auth = inject(Auth);
  private notifSub?: Subscription;
  private authUnsubscribe?: () => void;

  @Input() pageTitle = '';
  @Input() studentName = 'Sara Ahmad';
  @Input() level = 12;
  @Input() venturePoints = 2500;
  
  notifCount = 0;
  searchQuery = '';

  ngOnInit() {
    this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
      if (this.notifSub) {
        this.notifSub.unsubscribe();
      }
      if (user) {
        this.notifSub = this.notifService.getNotifications(user.uid).subscribe(notifications => {
          this.notifCount = notifications.filter(n => !n.isRead).length;
        });
      } else {
        this.notifCount = 0;
      }
    });
  }

  ngOnDestroy() {
    if (this.notifSub) {
      this.notifSub.unsubscribe();
    }
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  }

  get initials(): string {
    if (!this.studentName || this.studentName === '_ _') return '_';
    const parts = this.studentName.split(' ').filter(p => p && p !== '_');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return '_';
  }
}

