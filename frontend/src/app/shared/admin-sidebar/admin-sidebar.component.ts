import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar__logo">
        <div class="sidebar__logo-icon">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#1565C0"/>
            <path d="M7 9h14M7 14h9M7 19h11" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="sidebar__logo-text">
          <span class="sidebar__logo-name">EduVenture</span>
          <span class="sidebar__logo-sub">Admin portal</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar__nav">
        <ng-container *ngFor="let item of navItems">
          <a [routerLink]="item.route"
             routerLinkActive="sidebar__nav-item--active"
             class="sidebar__nav-item">
            <ng-container *ngTemplateOutlet="iconTpl; context: { icon: item.icon }"></ng-container>
            <span class="sidebar__nav-label">{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>

      <!-- Sign Out -->
      <div class="sidebar__footer">
        <button class="sidebar__signout" (click)="signOut()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>

    <!-- Icon template -->
    <ng-template #iconTpl let-icon="icon">
      <ng-container [ngSwitch]="icon">
        <svg *ngSwitchCase="'dashboard'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <svg *ngSwitchCase="'people'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
        </svg>
        <svg *ngSwitchCase="'storefront'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/>
          <path d="M9 22V12h6v10"/>
        </svg>
        <svg *ngSwitchCase="'messages'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg *ngSwitchCase="'notifications'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </ng-container>
    </ng-template>
  `,
  styleUrls: ['../sidebar/sidebar.component.css']
})
export class AdminSidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin-dashboard' },
    { label: 'Users', icon: 'people', route: '/admin-users' },
    { label: 'VentureShop', icon: 'storefront', route: '/admin-venture-shop' },
    { label: 'Messages', icon: 'messages', route: '/admin-messages' },
    { label: 'Notifications', icon: 'notifications', route: '/admin-notifications' },
  ];

  async signOut() {
    try {
      this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}

