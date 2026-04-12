import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivityService } from  '../../../activity/services/activity';
import { Activity, Submission } from  '../../../models/activity';

@Component({
  selector: 'app-take-activity',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './take-activity.html',
})
export class TakeActivityComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private fb      = inject(FormBuilder);
  service         = inject(ActivityService);

  activity: Activity | undefined;
  form!: FormGroup;
  result: Submission | undefined;   // shown after submit
  submitted = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/studentactivities']); return; }

    this.activity = this.service.getActivity(id);
    if (!this.activity) { this.router.navigate(['/studentactivities']); return; }

    const controls: Record<string, any> = {
      studentName: ['', Validators.required],
    };
    this.activity.questions.forEach(q => {
      controls[q.id] = ['', Validators.required];
    });
    this.form = this.fb.group(controls);
  }

  submit(): void {
    if (!this.activity || !this.form || this.form.invalid) {
      this.form?.markAllAsTouched();
      return;
    }

    const answers = this.activity.questions.map(q => ({
      questionId: q.id,
      answer: this.form.value[q.id],
    }));

    this.result = this.service.submitActivity({
      activityId: this.activity.id,
      studentName: this.form.value.studentName,
      answers,
    });

    this.submitted = true;
  }
  getQuestionText(questionId: string): string {
  return this.activity?.questions.find(q => q.id === questionId)?.text ?? questionId;
}
}