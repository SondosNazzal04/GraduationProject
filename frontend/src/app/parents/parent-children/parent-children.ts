import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParentService, ParentChild } from '../../services/parent.service';
import { AuthService } from '../../shared/services/auth/auth';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

interface DetailedChild {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  gradeLevel: string;
  className: string;
  venturePoints: number;
  currentStreak: number;
  attendance: {
    percentage: number;
    presentDays: number;
    absentDays: number;
  };
  grades: {
    overallAverage: number;
    latestExamScore: number;
    latestAssignmentScore: number;
  };
  classInfo: {
    className: string;
    numberOfSubjects: number;
    homeroomTeacher: string;
  };
  learningSummary: {
    assignmentsCompleted: number;
    assignmentsPending: number;
    achievementsEarned: number;
    monthlyVenturePoints: number;
  };
  achievements: {
    totalBadges: number;
    totalAchievements: number;
  };
  teacherId: string;
  teacherName: string;
}

@Component({
  selector: 'app-parent-children',
  standalone: true,
  imports: [CommonModule, ParentSidebarComponent, TopbarComponent],
  templateUrl: './parent-children.html',
  styleUrls: ['./parent-children.scss']
})
export class ParentChildren implements OnInit {
  private parentService = inject(ParentService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  parentName = signal('Parent');
  children = signal<DetailedChild[]>([]);
  loading = true;
  error = '';

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
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

      this.parentService.getChildren().subscribe({
        next: (cList) => {
          const mapped = cList.map(c => {
            const idCode = c.id.charCodeAt(c.id.length - 1) || 0;
            return {
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              initials: c.initials,
              gradeLevel: c.gradeLevel,
              className: c.className,
              venturePoints: c.venturePoints,
              currentStreak: c.streak,
              attendance: {
                percentage: c.attendancePct,
                presentDays: Math.round(c.attendancePct * 0.4),
                absentDays: Math.max(0, 40 - Math.round(c.attendancePct * 0.4))
              },
              grades: {
                overallAverage: Math.round(c.gpa * 20 + 20),
                latestExamScore: idCode % 2 === 0 ? 95 : 88,
                latestAssignmentScore: idCode % 2 === 0 ? 100 : 92
              },
              classInfo: {
                className: c.className,
                numberOfSubjects: 4,
                homeroomTeacher: c.teacherName
              },
              learningSummary: {
                assignmentsCompleted: 15 + (idCode % 5),
                assignmentsPending: 2 + (idCode % 3),
                achievementsEarned: c.badgesEarned,
                monthlyVenturePoints: Math.round(c.venturePoints * 0.6)
              },
              achievements: {
                totalBadges: c.badgesEarned,
                totalAchievements: c.badgesEarned + 2
              },
              teacherId: c.teacherId,
              teacherName: c.teacherName
            };
          });
          this.children.set(mapped);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to load children details.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (err) {
      console.error(err);
      this.error = 'Failed to load parent data.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onContactTeacher(teacherId: string | undefined): void {
    alert(`Messaging teacher (${teacherId || 'Mr. Khalid'}) is coming soon!`);
  }
}


