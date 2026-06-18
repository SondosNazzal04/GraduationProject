import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, AttendanceRecord, ParentChild } from '../../services/parent.service';
import { AuthService } from '../../shared/services/auth/auth';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, ParentSidebarComponent, TopbarComponent],
  templateUrl: './parent-attendance.html',
  styleUrls: ['./parent-attendance.scss']
})
export class ParentAttendance implements OnInit {
  private ps = inject(ParentService);
  private authService = inject(AuthService);

  parentName = signal('Parent');
  children = signal<ParentChild[]>([]);
  allRecords = signal<AttendanceRecord[]>([]);
  
  selectedChild = signal('all');
  selectedMonth = signal('all');
  months = ['all', 'January', 'February', 'March', 'April', 'May', 'June'];

  filtered = computed(() => {
    let r = this.allRecords();
    if (this.selectedChild() !== 'all') {
      r = r.filter(x => x.childId === this.selectedChild());
    }
    if (this.selectedMonth() !== 'all') {
      const monthIndex = this.months.indexOf(this.selectedMonth());
      r = r.filter(x => {
        const parts = x.date.split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          return m === monthIndex;
        }
        return false;
      });
    }
    return r;
  });

  async ngOnInit() {
    try {
      const profile = await this.authService.getParentProfile();
      if (profile) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        if (firstName || lastName) {
          this.parentName.set(`${firstName} ${lastName}`.trim());
        } else if (profile.email) {
          this.parentName.set(profile.email.split('@')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching parent profile:', err);
    }

    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getAttendance().subscribe(a => this.allRecords.set(a));
  }

  get presentCount(): number {
    return this.filtered().filter(r => r.status === 'present').length;
  }

  get absentCount(): number {
    return this.filtered().filter(r => r.status === 'absent').length;
  }

  get lateCount(): number {
    return this.filtered().filter(r => r.status === 'late').length;
  }

  get totalCount(): number {
    return this.filtered().length;
  }

  get presentPct(): number {
    return this.totalCount ? Math.round((this.presentCount / this.totalCount) * 100) : 0;
  }

  sc(s: string) {
    return s === 'present' ? '#22c55e' : s === 'late' ? '#f59e0b' : '#ef4444';
  }

  sb(s: string) {
    return s === 'present' ? '#dcfce7' : s === 'late' ? '#fef3c7' : '#fee2e2';
  }
}


