import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../../services/teacher.service';
import { ClassRoom, AttendanceRecord, AttendanceStatus } from '../../../models/teacher.model';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AuthService } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-teacherattendance',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './teacherattendance.html',
  styleUrls: ['./teacherattendance.scss']
})
export class Teacherattendance implements OnInit {
  classes: ClassRoom[] = [];
  selectedClassId = 'c1';
  today = new Date().toISOString().split('T')[0];
  selectedDate = this.today;
  records: AttendanceRecord[] = [];
  savedSuccessfully = false;
  teacherName = 'Mr. Smith';

  constructor(
    private teacherService: TeacherService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.teacherService.getClasses().subscribe(c => {
      this.classes = c;
      if (c.length && (this.selectedClassId === 'c1' || !c.some(item => item.id === this.selectedClassId))) {
        this.selectedClassId = c[0].id;
        this.onClassChange();
      }
    });
    this.teacherService.getAttendance().subscribe(all => {
      this.initRecords(all);
    });
  }

  get selectedClass(): ClassRoom | undefined {
    return this.classes.find(c => c.id === this.selectedClassId);
  }

  onClassChange(): void {
    this.teacherService.getAttendance().subscribe(all => this.initRecords(all));
  }

  onDateChange(): void {
    this.teacherService.getAttendance().subscribe(all => this.initRecords(all));
  }

  private initRecords(all: AttendanceRecord[]): void {
    const students = this.teacherService.getStudentsByClass(this.selectedClassId);
    const existing = all.filter(r => r.classId === this.selectedClassId && r.date === this.selectedDate);
    this.records = students.map(s => {
      const ex = existing.find(r => r.studentId === s.id);
      return ex ?? {
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        initials: s.initials,
        date: this.selectedDate,
        status: 'present' as AttendanceStatus,
        classId: this.selectedClassId,
        percentage: 100
      };
    });
  }

  setStatus(record: AttendanceRecord, status: AttendanceStatus): void {
    record.status = status;
  }

  get presentCount(): number  { return this.records.filter(r => r.status === 'present').length; }
  get absentCount(): number   { return this.records.filter(r => r.status === 'absent').length; }
  get lateCount(): number     { return this.records.filter(r => r.status === 'late').length; }
  get attendancePct(): number {
    if (!this.records.length) return 0;
    return Math.round((this.presentCount / this.records.length) * 100);
  }

  saveAttendance(): void {
    this.teacherService.saveAttendance([...this.records]);
    this.savedSuccessfully = true;
    setTimeout(() => this.savedSuccessfully = false, 2500);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  markAll(status: AttendanceStatus): void {
    this.records.forEach(r => r.status = status);
  }

  private loadProfile(): void {
    this.authService.getTeacherProfile().then(profile => {
      if (profile) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        if (firstName || lastName) {
          this.teacherName = `${firstName} ${lastName}`.trim();
        } else if (profile.email) {
          this.teacherName = profile.email.split('@')[0];
        }
      }
    }).catch(err => {
      console.warn('Failed to load teacher profile', err);
    });
  }
}