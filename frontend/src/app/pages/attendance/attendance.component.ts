import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Student } from '../../services/data.service';

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'late' | 'absent' | null;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-topbar">
        <h1 class="page-title">Take Attendance</h1>
        <div class="topbar-right">
          <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" width="20" height="20">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div class="user-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" width="16" height="16">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span>Khalid</span>
          </div>
        </div>
      </div>

      <div class="date-bar">
        <div class="date-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.8" width="18" height="18">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span>Sunday,December 29,2025</span>
        </div>
        <button class="btn-save" (click)="saveAttendance()">Save Attendance</button>
      </div>

      <div class="student-list-card">
        <div class="list-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.8" width="18" height="18">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span class="list-title">Student List</span>
        </div>

        <div class="student-rows">
          <div class="student-row" *ngFor="let student of dataService.students">
            <div class="student-info">
              <div class="avatar">{{ student.initials }}</div>
              <div class="student-details">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-attendance">Attendance {{ student.attendancePercent }}%</div>
              </div>
            </div>
            <div class="attendance-actions">
              <button
                class="att-btn present"
                [class.selected]="getStatus(student.id) === 'present'"
                (click)="setStatus(student.id, 'present')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
                present
              </button>
              <button
                class="att-btn late"
                [class.selected]="getStatus(student.id) === 'late'"
                (click)="setStatus(student.id, 'late')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Late
              </button>
              <button
                class="att-btn absent"
                [class.selected]="getStatus(student.id) === 'absent'"
                (click)="setStatus(student.id, 'absent')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Absent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { height: 100%; }

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

    .date-bar {
      background: white;
      border-radius: 10px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      border: 1px solid #f0f0f0;
    }

    .date-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    .btn-save {
      background: #2563eb;
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      color: white;
      cursor: pointer;

      &:hover { background: #1d4ed8; }
    }

    .student-list-card {
      background: white;
      border-radius: 10px;
      border: 1px solid #f0f0f0;
      overflow: hidden;
    }

    .list-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
    }

    .list-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
    }

    .student-rows {
      display: flex;
      flex-direction: column;
    }

    .student-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: #f8f9ff;
      border-bottom: 1px solid #f0f0f0;

      &:last-child { border-bottom: none; }
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 38px;
      height: 38px;
      background: #c7d2fe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #3730a3;
    }

    .student-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .student-attendance {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }

    .attendance-actions {
      display: flex;
      gap: 6px;
    }

    .att-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      background: white;
      color: #374151;
      transition: all 0.15s;

      &:hover { background: #f3f4f6; }

      &.present.selected {
        background: #dcfce7;
        border-color: #16a34a;
        color: #15803d;
      }

      &.late.selected {
        background: #fef9c3;
        border-color: #ca8a04;
        color: #a16207;
      }

      &.absent.selected {
        background: #fee2e2;
        border-color: #dc2626;
        color: #dc2626;
      }
    }
  `]
})
export class AttendanceComponent {
  records: AttendanceRecord[] = [];

  constructor(public dataService: DataService) {
    this.records = this.dataService.students.map(s => ({
      studentId: s.id,
      status: null
    }));
  }

  getStatus(studentId: string): string | null {
    return this.records.find(r => r.studentId === studentId)?.status ?? null;
  }

  setStatus(studentId: string, status: 'present' | 'late' | 'absent') {
    const record = this.records.find(r => r.studentId === studentId);
    if (record) record.status = status;
  }

  saveAttendance() {
    alert('Attendance saved!');
  }
}
