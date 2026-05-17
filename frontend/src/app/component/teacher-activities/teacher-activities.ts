


import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup,
         FormArray, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../activity/services/activity';

@Component({
  selector: 'app-create-activity',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './teacher-activities.html',
})
export class CreateActivityComponent {
  private fb     = inject(FormBuilder);
  private service = inject(ActivityService);
  private router  = inject(Router);

  form: FormGroup = this.fb.group({
    title:       ['', Validators.required],
    description: [''],
    type:        ['quiz', Validators.required],
    questions:   this.fb.array([], Validators.required),
  });

  // Typed getter — avoids repetition in template
  get questions(): FormArray { return this.form.get('questions') as FormArray; }

  optionsFor(qIndex: number): FormArray {
    return this.questions.at(qIndex).get('options') as FormArray;
  }

  // ── Question management ──────────────────────────────────────────────────

  addQuestion(): void {
    this.questions.push(this.fb.group({
      text:          ['', Validators.required],
      type:          ['mcq'],
      options:       this.fb.array([this.newOption(), this.newOption()]),
      correctAnswer: ['', Validators.required],
    }));
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  onTypeChange(qIndex: number): void {
    const q = this.questions.at(qIndex);
    const type = q.get('type')?.value;
    const optionsArray = this.optionsFor(qIndex);

    optionsArray.clear();
    q.get('correctAnswer')?.setValue('');

    if (type === 'mcq') {
      optionsArray.push(this.newOption());
      optionsArray.push(this.newOption());
    } else if (type === 'true-false') {
      optionsArray.push(this.newOption('True'));
      optionsArray.push(this.newOption('False'));
    }
    // fill-blank needs no options array
  }

  // ── Option management (MCQ only) ─────────────────────────────────────────

  private newOption(text = ''): FormGroup {
    return this.fb.group({ id: [crypto.randomUUID()], text: [text, Validators.required] });
  }

  addOption(qIndex: number): void {
    this.optionsFor(qIndex).push(this.newOption());
  }

  removeOption(qIndex: number, oIndex: number): void {
    this.optionsFor(qIndex).removeAt(oIndex);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.service.createActivity(this.form.value);
    this.router.navigate(['/activities']);
  }
}