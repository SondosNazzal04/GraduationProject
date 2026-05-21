import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, ClassItem } from '../../services/data.service';

@Component({
  selector: 'app-my-classes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-topbar">
        <h1 class="page-title">My classes</h1>
        <div class="topbar-right">
          <svg class="icon-bell" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" width="20" height="20">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div class="user-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" width="16" height="16">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span>Mr.Khalid</span>
          </div>
        </div>
      </div>

      <div class="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.8" width="16" height="16">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="search classes..." [(ngModel)]="searchQuery" />
      </div>

      <div class="classes-grid">
        <div class="class-card" *ngFor="let cls of filteredClasses()">
          <div class="card-left">
            <div class="book-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" width="30" height="30">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div class="card-info">
              <h2 class="class-name">{{ cls.name }}</h2>
              <div class="class-time">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.8" width="13" height="13">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span>{{ cls.time }}</span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-attendance" (click)="goToAttendance()">Attendance</button>
            <button class="btn-gradebook" (click)="goToGradebook()">
              Gradebook
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="14" height="14">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      height: 100%;
    }

    .page-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #374151;
      font-weight: 500;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 12px;
      width: 240px;
      margin-bottom: 24px;

      input {
        border: none;
        outline: none;
        font-size: 13px;
        color: #374151;
        width: 100%;
        background: transparent;

        &::placeholder { color: #9ca3af; }
      }
    }

    .classes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .class-card {
      background: white;
      border-radius: 12px;
      padding: 24px 20px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border: 1px solid #f0f0f0;
    }

    .card-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .book-icon {
      width: 52px;
      height: 52px;
      background: #dcfce7;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .class-name {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .class-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #9ca3af;
    }

    .card-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
      min-width: 120px;
    }

    .btn-attendance {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      text-align: center;

      &:hover { background: #f9fafb; }
    }

    .btn-gradebook {
      background: #2563eb;
      border: none;
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      &:hover { background: #1d4ed8; }
    }
  `]
})
export class MyClassesComponent {
  searchQuery = '';

  constructor(private router: Router, public dataService: DataService) {}

  filteredClasses(): ClassItem[] {
    if (!this.searchQuery.trim()) return this.dataService.classes;
    return this.dataService.classes.filter(c =>
      c.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  goToAttendance() { this.router.navigate(['/attendance']); }
  goToGradebook() { this.router.navigate(['/gradebook']); }
}
