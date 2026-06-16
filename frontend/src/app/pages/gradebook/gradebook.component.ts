import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { ClassRoom, GradeRecord, StudentGradeSummary, ActivityType } from '../../models/teacher.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AuthService } from '../../shared/services/auth/auth';

@Component({
  selector: 'app-gradebook',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, TitleCasePipe],
  templateUrl: './gradebook.component.html',
  styleUrls: ['./gradebook.component.scss']
})
export class GradebookComponent implements OnInit {
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
      }
      this.loadSubjects();
      this.summaries = this.teacherService.getGradeSummaryByClass(this.selectedClassId);
    });
    this.teacherService.getGrades().subscribe(() => {
      this.summaries = this.teacherService.getGradeSummaryByClass(this.selectedClassId);
      if (this.selectedStudent) {
        this.selectedStudent = this.summaries.find(s => s.studentId === this.selectedStudent!.studentId) ?? null;
      }
    });
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
    setTimeout(() => this.savedSuccessfully = false, 2500);
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
