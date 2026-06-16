import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-name">EduVenture</span>
          <span class="logo-sub">Teacher portal</span>
        </div>
      </div>

      <nav class="nav">
        <a class="nav-item" routerLink="/teacher-dashboard" routerLinkActive="active">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Dashboard</span>
        </a>

        <a class="nav-item" routerLink="/my-classes" routerLinkActive="active">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="10" width="18" height="4" rx="1" />
            <rect x="3" y="16" width="18" height="4" rx="1" />
          </svg>
          <span>My classes</span>
        </a>

        <a class="nav-item" routerLink="/attendance" routerLinkActive="active">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span>Attendance</span>
        </a>

        <a class="nav-item" routerLink="/gradebook" routerLinkActive="active">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span>Gradebook</span>
        </a>

        <a class="nav-item" routerLink="/activities" routerLinkActive="active">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l3 3" />
          </svg>
          <span>Activities</span>
        </a>

        <a class="nav-item" routerLink="/teacher-messages" routerLinkActive="active">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Messages</span>
        </a>

        <a class="nav-item" routerLink="/teacher-messages" routerLinkActive="active">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>Notifications</span>
        </a>
      </nav>

      <div class="sign-out">
        <a href="#" class="sign-out-link">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            width="15"
            height="15"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .sidebar {
        width: 200px;
        min-width: 200px;
        height: calc(100vh - 48px);
        position: sticky;
        top: 24px;
        background: #ffffff;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        padding: 16px 0;
        color: #374151;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px 18px;
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 8px;
      }

      .logo-icon {
        width: 32px;
        height: 32px;
        background: #2563eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .logo-text {
        display: flex;
        flex-direction: column;
      }

      .logo-name {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        line-height: 1.2;
      }

      .logo-sub {
        font-size: 9px;
        color: #083685;
        line-height: 1.4;
      }

      .nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 0 8px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        color: #374151;
        text-decoration: none;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.15s;

        &:hover {
          background: #f3f4f6;
          color: #111827;
        }

        &.active {
          background: #2563eb;
          color: #ffffff;
        }
      }

      .nav-icon {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
        stroke: currentColor;
      }

      .sign-out {
        padding: 14px 14px 0;
        border-top: 1px solid #f0f0f0;
        margin-top: auto;
      }

      .sign-out-link {
        display: flex;
        align-items: center;
        gap: 16px;
        color: #6b7280;
        text-decoration: none;
        font-size: 12px;

        &:hover {
          color: #111827;
        }
      }
    `,
  ],
})
export class SidebarComponent {}
