import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { NotificationService } from '../services/notifications/notification.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow" *ngIf="eyebrow">{{ eyebrow }}</p>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="page-subtitle" *ngIf="pageSubtitle">{{ pageSubtitle }}</p>
      </div>
      <div class="topbar-actions">
        <button class="icon-btn" routerLink="/admin-notifications" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="badge" *ngIf="notifCount > 0">{{ notifCount }}</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: #ffffff; border-bottom: 1px solid #e8eaed; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .eyebrow { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
    .page-subtitle { font-size: 13px; color: #555; margin: 4px 0 0; }
    .topbar-actions { display: flex; align-items: center; gap: 12px; }
    .icon-btn { position: relative; width: 40px; height: 40px; border-radius: 50%; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; }
    .icon-btn:hover { background: #f0f0f0; }
    .badge { position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; font-size: 10px; font-weight: 700; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; }
  `]
})
export class AdminTopbarComponent implements OnInit, OnDestroy {
  @Input() pageTitle = 'Dashboard';
  @Input() eyebrow = '';
  @Input() pageSubtitle = '';

  private notifService = inject(NotificationService);
  private auth = inject(Auth);
  private notifSub?: Subscription;
  private authUnsubscribe?: () => void;
  notifCount = 0;

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
}
