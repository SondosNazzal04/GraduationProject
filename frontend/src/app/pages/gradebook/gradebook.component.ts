import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { ClassRoom, GradeRecord, StudentGradeSummary, ActivityType } from '../../models/teacher.model';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AuthService } from '../../shared/services/auth/auth';
import { Subject, combineLatest, takeUntil } from 'rxjs';


@Component({
  selector: 'app-gradebook',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, TitleCasePipe],
  templateUrl: './gradebook.component.html',
  styleUrls: ['./gradebook.component.scss']
})
export class GradebookComponent implements OnInit, OnDestroy {
  classes: ClassRoom[] = [];
  selectedClassId = 'c1';
  summaries: StudentGradeSummary[] = [];
  selectedStudent: StudentGradeSummary | null = null;

  // Add grade form
  showForm = false;
  savedSuccessfully = false;
  newGrade: Partial<GradeRecord> = {};
  activityTypes: ActivityType[] = ['exam', 'assignment', 'quiz'];
  subjects: string[] = [];
  teacherName = 'Mr. Smith';
  
  private destroy$ = new Subject<void>();

  constructor(
    private teacherService: TeacherService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    
    combineLatest([
      this.teacherService.getClasses(),
      this.teacherService.getStudents(),
      this.teacherService.getGrades()
    ]).pipe(takeUntil(this.destroy$)).subscribe(([classes, students, grades]) => {
      this.classes = classes;
      if (classes.length && (this.selectedClassId === 'c1' || !classes.some(item => item.id === this.selectedClassId))) {
        this.selectedClassId = classes[0].id;
      }
      this.loadSubjects();
      this.summaries = this.teacherService.getGradeSummaryByClass(this.selectedClassId);
      
      if (this.selectedStudent) {
        this.selectedStudent = this.summaries.find(s => s.studentId === this.selectedStudent!.studentId) ?? null;
      }
      
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClassChange(): void {
    this.summaries = this.teacherService.getGradeSummaryByClass(this.selectedClassId);
    this.selectedStudent = null;
    this.loadSubjects();
  }

  loadSubjects(): void {
    const cls = this.classes.find(c => c.id === this.selectedClassId);
    this.subjects = cls ? cls.subjects.map(s => s.name) : [];
  }

  selectStudent(s: StudentGradeSummary): void {
    this.selectedStudent = s;
    this.showForm = false;
  }

  openAddGrade(): void {
    this.newGrade = {
      studentId: this.selectedStudent?.studentId,
      classId: this.selectedClassId,
      date: new Date().toISOString().split('T')[0],
      maxScore: 100,
      score: 0,
      activityType: 'exam',
      subject: this.subjects[0] ?? ''
    };
    this.showForm = true;
  }

  submitGrade(): void {
    if (!this.newGrade.activityTitle || !this.newGrade.subject || this.newGrade.score == null) return;
    const student = this.summaries.find(s => s.studentId === this.newGrade.studentId);
    this.teacherService.saveGrade({
      ...this.newGrade,
      id: '',
      studentName: student?.studentName ?? '',
      initials: student?.initials ?? '',
    } as GradeRecord);
    this.showForm = false;
    this.savedSuccessfully = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.savedSuccessfully = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  deleteGrade(id: string): void {
    this.teacherService.deleteGrade(id);
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  }

  getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Pass';
    return 'Fail';
  }

  get classAverage(): number {
    if (!this.summaries.length) return 0;
    return Math.round(this.summaries.reduce((s, st) => s + st.overallAverage, 0) / this.summaries.length);
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


