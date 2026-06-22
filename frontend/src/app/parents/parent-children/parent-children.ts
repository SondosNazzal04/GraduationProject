import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
  private router = inject(Router);

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

      try {
        const cList = await firstValueFrom(this.parentService.getChildren());

        const mapped: DetailedChild[] = await Promise.all(cList.map(async (c) => {
          // Fetch real data for each child
          const [attendanceRecords, gradeRecords, classRecords, achievementRecords, learningProgress, venturePointsRecords] = await Promise.all([
            firstValueFrom(this.parentService.getAttendance(c.id)),
            firstValueFrom(this.parentService.getGrades(c.id)),
            firstValueFrom(this.parentService.getClasses(c.id)),
            firstValueFrom(this.parentService.getAchievements(c.id)),
            firstValueFrom(this.parentService.getLearningProgress(c.id)),
            firstValueFrom(this.parentService.getVenturePoints(c.id))
          ]);

          // Calculate real attendance stats
          const totalDays = attendanceRecords.length;
          const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
          const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
          const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
          const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 100;

          // Calculate real GPA
          let overallAverage = 0;
          if (gradeRecords.length > 0) {
            const sum = gradeRecords.reduce((acc, g) => acc + (g.percentage || 0), 0);
            overallAverage = Math.round(sum / gradeRecords.length);
          }

          // Real latest exam and assignment
          let latestExamScore = overallAverage;
          let latestAssignmentScore = overallAverage;
          if (gradeRecords.length > 0) {
            latestExamScore = gradeRecords[0]?.percentage || overallAverage;
            latestAssignmentScore = gradeRecords[1]?.percentage || overallAverage;
          }

          // Real class info
          const numberOfSubjects = classRecords.length;
          const homeroomTeacher = classRecords.length > 0 && classRecords[0].teacher ? classRecords[0].teacher : 'Teacher';
          const actualClassName = classRecords.length > 0 && classRecords[0].name ? classRecords[0].name : c.className;

          // Achievements and learning summary
          const badgesEarned = achievementRecords.length;
          let assignmentsCompleted = 0;
          let assignmentsTotal = 0;
          learningProgress.forEach(lp => {
             assignmentsCompleted += lp.assignmentsCompleted || 0;
             assignmentsTotal += lp.assignmentsTotal || 0;
          });

          // monthly venture points
          const monthlyVenturePoints = venturePointsRecords.reduce((acc, vp) => acc + (vp.type === 'earned' ? vp.points : 0), 0);

          return {
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            initials: c.initials,
            gradeLevel: c.gradeLevel,
            className: actualClassName,
            venturePoints: c.venturePoints,
            currentStreak: c.streak,
            attendance: {
              percentage: attendancePercentage,
              presentDays: presentDays + lateDays,
              absentDays: absentDays
            },
            grades: {
              overallAverage: overallAverage,
              latestExamScore,
              latestAssignmentScore
            },
            classInfo: {
              className: actualClassName,
              numberOfSubjects,
              homeroomTeacher
            },
            learningSummary: {
              assignmentsCompleted,
              assignmentsPending: Math.max(0, assignmentsTotal - assignmentsCompleted),
              achievementsEarned: badgesEarned,
              monthlyVenturePoints
            },
            achievements: {
              totalBadges: badgesEarned,
              totalAchievements: badgesEarned
            },
            teacherId: classRecords[0]?.id || c.teacherId,
            teacherName: homeroomTeacher !== 'Teacher' ? homeroomTeacher : c.teacherName
          };
        }));

        this.children.set(mapped);
        this.loading = false;
        this.cdr.detectChanges();
      } catch (err) {
        console.error(err);
        this.error = 'Failed to load children details.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error(err);
      this.error = 'Failed to load parent data.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onContactTeacher(): void {
    this.router.navigate(['/parent-messages']);
  }
}


