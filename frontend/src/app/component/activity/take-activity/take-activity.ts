import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../activity/services/activity';
import { Activity, Submission } from '../../../models/activity';
import { StudentPortalService } from '../../../services/student-portal.service';
import { AuthService } from '../../../shared/services/auth/auth';
import { StudentSidebarComponent } from '../../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../../shared/student-topbar/student-topbar.component';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../../firebase.runtime-config';

@Component({
  selector: 'app-take-activity',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './take-activity.html',
  styleUrls: ['./take-activity.scss'],
})
export class TakeActivityComponent implements OnInit, OnDestroy {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private fb      = inject(FormBuilder);
  private ngZone  = inject(NgZone);
  private studentService = inject(StudentPortalService);
  private authService = inject(AuthService);
  service         = inject(ActivityService);

  activity: Activity | undefined;
  form!: FormGroup;
  result: Submission | undefined;

  submitted    = false;
  isPastDue    = false;
  started      = false;

  hasTimer        = false;
  timeRemaining   = 0;
  timerExpired    = false;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;
  realProfile: any = null;

  get timerMinutes(): number { return Math.floor(this.timeRemaining / 60); }
  get timerSeconds(): number { return this.timeRemaining % 60; }
  get timerWarning(): boolean { return this.timeRemaining <= 60 && this.timeRemaining > 0; }
  get timerDanger():  boolean { return this.timeRemaining <= 30 && this.timeRemaining > 0; }

  get prof() {
    const mock = this.studentService.profile();
    if (this.realProfile) {
      const fName = this.realProfile.firstName || '_';
      const lName = this.realProfile.lastName || '_';
      return {
        ...mock,
        name: `${fName} ${lName}`,
        venturePoints: this.realProfile.pointsBalance,
      };
    }
    return mock;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/studentactivities']); return; }

    this.activity = this.service.getActivity(id);
    if (!this.activity) { this.router.navigate(['/studentactivities']); return; }

    // تحقق إذا انتهت المدة
    if (this.activity.dueDate) {
      const due = new Date(this.activity.dueDate);
      due.setHours(23, 59, 59);
      this.isPastDue = new Date() > due;
      if (this.isPastDue) return;
    }

    // تحقق إذا الطالب حل هاد الكويز من قبل
    const submittedList: string[] = JSON.parse(
      localStorage.getItem('submittedActivities') || '[]'
    );
    if (submittedList.includes(id)) {
      this.router.navigate(['/studentactivities']);
      return;
    }

    // بناء الفورم مبدئيا مع اسم مقلد
    const controls: Record<string, any> = {
      studentName: [this.studentService.profile().name, Validators.required],
    };
    this.activity.questions.forEach(q => {
      controls[q.id] = ['', Validators.required];
    });
    this.form = this.fb.group(controls);

    // Fetch real profile async without blocking
    this.fetchRealProfile();

    // جلب الاسم الحقيقي من السيرفر
    this.authService.getStudentProfile().then((profile: any) => {
      if (profile) {
        const realName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'Unknown';
        this.form.patchValue({ studentName: realName });
      }
    }).catch(e => console.warn('Failed to fetch real student profile', e));
  }

  private async fetchRealProfile() {
    try {
      this.realProfile = await firstValueFrom<any>(this.http.get(`${this.baseUrl}/student/me`));
    } catch (e) { console.error(e); }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ★ يبدأ الوقت فور ما يضغط Start ★
  startQuiz(): void {
    this.started = true;

    if (this.activity?.timeLimit && this.activity.timeLimit > 0) {
      this.hasTimer      = true;
      this.timeRemaining = this.activity.timeLimit * 60;
      this.startTimer();
    }
  }

  private startTimer(): void {
    this.ngZone.runOutsideAngular(() => {
      this.timerInterval = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
          this.ngZone.run(() => {}); // ★ يحدّث الشاشة كل ثانية تلقائياً
        } else {
          this.stopTimer();
          this.ngZone.run(() => {
            this.timerExpired = true;
            this.autoSubmit();
          });
        }
      }, 1000);
    });
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private autoSubmit(): void {
    if (this.submitted || !this.activity) return;
    this.activity.questions.forEach(q => {
      if (!this.form.value[q.id]) {
        this.form.get(q.id)?.setValue('');
      }
    });
    this.doSubmit();
  }

  submit(): void {
    if (!this.activity || !this.form || this.form.invalid) {
      this.form?.markAllAsTouched();
      return;
    }
    this.doSubmit();
  }

  private async doSubmit(): Promise<void> {
    if (!this.activity) return;
    this.stopTimer();

    const answers = this.activity.questions.map(q => ({
      questionId: q.id,
      answer: this.form.value[q.id] ?? '',
    }));

    // احفظ الـ activityId عشان ما يقدر يرجع
    const submittedList: string[] = JSON.parse(
      localStorage.getItem('submittedActivities') || '[]'
    );
    if (!submittedList.includes(this.activity.id)) {
      submittedList.push(this.activity.id);
      localStorage.setItem('submittedActivities', JSON.stringify(submittedList));
    }

    localStorage.setItem('lastStudentName', this.form.value.studentName || '');

    // انتظار النتيجة الحقيقية من السيرفر
    this.result = await this.service.submitActivity({
      activityId:  this.activity.id,
      studentName: this.form.value.studentName || 'Unknown',
      answers,
    });

    this.submitted = true;
  }

  getQuestionText(questionId: string): string {
    return this.activity?.questions.find(q => q.id === questionId)?.text ?? questionId;
  }
}
