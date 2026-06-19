import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, GradeEntry } from '../../services/student-portal.service';
import { AuthService } from '../../shared/services/auth/auth';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './student-grades.html',
  styleUrls: ['./student-grades.scss']
})
export class StudentGradesComponent implements OnInit {
  private portalService = inject(StudentPortalService);
  private authService = inject(AuthService);

  studentName = signal('Student');
  allGrades = signal<GradeEntry[]>([]);

  async ngOnInit() {
    try {
      const profile: any = await this.authService.getStudentProfile();
      if (profile) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        if (firstName || lastName) {
          this.studentName.set(`${firstName} ${lastName}`.trim());
        } else if (profile.email) {
          this.studentName.set(profile.email.split('@')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
    }

    this.portalService.getGrades().subscribe(g => this.allGrades.set(g));
  }

  get avgGpa(): number {
    const g = this.allGrades();
    return g.length ? Math.round((g.reduce((s, x) => s + x.percentage, 0) / g.length) * 10) / 10 : 0;
  }

  get highest(): number {
    const g = this.allGrades();
    return g.length ? Math.max(...g.map(x => x.percentage)) : 0;
  }

  get lowest(): number {
    const g = this.allGrades();
    return g.length ? Math.min(...g.map(x => x.percentage)) : 0;
  }

  get totalSubj(): number {
    return new Set(this.allGrades().map(x => x.subject)).size;
  }

  gc(p: number): string {
    return p >= 90 ? '#22c55e' : p >= 75 ? '#f59e0b' : '#ef4444';
  }

  gb(p: number): string {
    return p >= 90 ? '#dcfce7' : p >= 75 ? '#fef3c7' : '#fee2e2';
  }

  gs(s: string): string {
    return s === 'excellent' ? 'chip--blue' : s === 'pass' ? 'chip--green' : 'chip--red';
  }
}
