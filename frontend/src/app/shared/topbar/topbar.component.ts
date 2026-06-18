import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../services/notifications/notification.service';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private notifService = inject(NotificationService);
  private auth = inject(Auth);
  private notifSub?: Subscription;
  private authUnsubscribe?: () => void;

  @Input() pageTitle: string = '';
  @Input() userName: string = 'Mr. Smith';
  @Input() roleName?: string;
  @Input() showSearch: boolean = true;
  @Input() messagesRoute?: string;
  @Input() notificationsRoute?: string;
  
  searchQuery = '';
  notifCount = 0;

  ngOnInit() {
    const url = this.router.url;
    if (url.includes('parent')) {
      if (!this.roleName) this.roleName = 'Parent';
      if (!this.messagesRoute) this.messagesRoute = '/parent-messages';
      if (!this.notificationsRoute) this.notificationsRoute = '/parent-notifications';
    } else {
      if (!this.roleName) this.roleName = 'Teacher';
      if (!this.messagesRoute) this.messagesRoute = '/teacher-messages';
      if (!this.notificationsRoute) this.notificationsRoute = '/teacher-notifications';
    }

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
}

