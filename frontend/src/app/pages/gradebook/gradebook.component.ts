import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Student } from '../../services/data.service';

interface GradeEntry {
  studentId: string;
  newGrade: string;
  awardPoint: number;
}

@Component({
  selector: 'app-gradebook',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-topbar">
        <h1 class="page-title">Gradebook</h1>
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
            <span>Mr.Khalid</span>
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <select [(ngModel)]="selectedSubject" class="filter-select">
            <option value="MATH">MATH</option>
            <option value="Arabic">Arabic</option>
            <option value="English">English</option>
            <option value="Science">Science</option>
          </select>
          <select [(ngModel)]="selectedQuiz" class="filter-select">
            <option *ngFor="let q of dataService.quizzes" [value]="q">{{ q }}</option>
          </select>
        </div>
        <button class="btn-save" (click)="saveGrades()">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="15" height="15">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          Save Grade
        </button>
      </div>

      <div class="grade-card">
        <div class="grade-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.8" width="18" height="18">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          <span>{{ selectedSubject }} - Grade</span>
        </div>

        <div class="grade-table">
          <div class="table-header">
            <div class="col-student">Student</div>
            <div class="col-grade">Current Grade</div>
            <div class="col-points">Points</div>
            <div class="col-new">New Gradebook</div>
            <div class="col-award">Award Point</div>
          </div>

          <div class="table-row" *ngFor="let student of dataService.students">
            <div class="col-student student-cell">
              <div class="avatar">{{ student.initials }}</div>
              <span class="student-name">{{ student.name }}</span>
            </div>
            <div class="col-grade">
              <span class="grade-badge">{{ student.currentGrade }}</span>
            </div>
            <div class="col-points">{{ student.points }}</div>
            <div class="col-new">
              <input
                type="text"
                class="new-grade-input"
                [(ngModel)]="getEntry(student.id).newGrade"
                placeholder="——"
              />
            </div>
            <div class="col-award">
              <div class="award-control">
                <input
                  type="number"
                  class="award-input"
                  [(ngModel)]="getEntry(student.id).awardPoint"
                  min="0"
                />
                <div class="award-spinners">
                  <button class="spinner-btn" (click)="increment(student.id)">▲</button>
                  <button class="spinner-btn" (click)="decrement(student.id)">▼</button>
                </div>
              </div>
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

    .filter-bar {
      background: white;
      border-radius: 10px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      border: 1px solid #f0f0f0;
    }

    .filter-group {
      display: flex;
      gap: 10px;
    }

    .filter-select {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 6px 28px 6px 10px;
      font-size: 13px;
      color: #374151;
      background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 8px center;
      appearance: none;
      cursor: pointer;
      outline: none;

      &:focus { border-color: #2563eb; }
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
      display: flex;
      align-items: center;
      gap: 6px;

      &:hover { background: #1d4ed8; }
    }

    .grade-card {
      background: white;
      border-radius: 10px;
      border: 1px solid #f0f0f0;
      overflow: hidden;
    }

    .grade-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .grade-table {
      width: 100%;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2.5fr 1.5fr 1.5fr 1.5fr 1.5fr;
      padding: 10px 20px;
      background: white;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
      color: #9ca3af;
      font-weight: 500;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2.5fr 1.5fr 1.5fr 1.5fr 1.5fr;
      padding: 12px 20px;
      align-items: center;
      border-bottom: 1px solid #f9fafb;

      &:last-child { border-bottom: none; }

      &:nth-child(odd) { background: #fafafa; }
    }

    .student-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      background: #c7d2fe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #3730a3;
      flex-shrink: 0;
    }

    .student-name {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
    }

    .grade-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 10px;
      min-width: 38px;
    }

    .col-points {
      font-size: 13px;
      color: #374151;
      font-weight: 500;
    }

    .new-grade-input {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 13px;
      width: 80px;
      color: #374151;
      outline: none;
      text-align: center;

      &::placeholder { color: #9ca3af; }
      &:focus { border-color: #2563eb; }
    }

    .award-control {
      display: flex;
      align-items: center;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
      width: 80px;
    }

    .award-input {
      border: none;
      outline: none;
      padding: 6px 8px;
      font-size: 13px;
      width: 50px;
      color: #374151;
      text-align: center;
      -moz-appearance: textfield;

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button { -webkit-appearance: none; }
    }

    .award-spinners {
      display: flex;
      flex-direction: column;
      border-left: 1px solid #e5e7eb;
    }

    .spinner-btn {
      background: white;
      border: none;
      padding: 0 5px;
      font-size: 8px;
      cursor: pointer;
      color: #6b7280;
      line-height: 1.4;
      height: 15px;

      &:hover { background: #f3f4f6; }
      &:first-child { border-bottom: 1px solid #e5e7eb; }
    }
  `]
})
export class GradebookComponent {
  selectedSubject = 'MATH';
  selectedQuiz = 'Quiz#3';
  entries: GradeEntry[] = [];

  constructor(public dataService: DataService) {
    this.entries = this.dataService.students.map(s => ({
      studentId: s.id,
      newGrade: '',
      awardPoint: 0
    }));
  }

  getEntry(studentId: string): GradeEntry {
    return this.entries.find(e => e.studentId === studentId) as GradeEntry;
  }

  increment(studentId: string) {
    const e = this.getEntry(studentId);
    e.awardPoint++;
  }

  decrement(studentId: string) {
    const e = this.getEntry(studentId);
    if (e.awardPoint > 0) e.awardPoint--;
  }

  saveGrades() {
    alert('Grades saved!');
  }
}
