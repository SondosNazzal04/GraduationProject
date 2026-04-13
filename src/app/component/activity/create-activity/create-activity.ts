import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup,
         FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../activity/services/activity';
import { Activity } from '../../../models/activity';

@Component({
  selector: 'app-create-activity',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './create-activity.html',
})
export class CreateActivityComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(ActivityService);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);

  // ── Edit mode detection ──────────────────────────────────────────────────
  isEditMode   = false;
  editActivity: Activity | undefined;

  form: FormGroup = this.fb.group({
    title:       ['', Validators.required],
    description: [''],
    type:        ['quiz', Validators.required],
    questions:   this.fb.array([], Validators.required),
  });

  get questions(): FormArray { return this.form.get('questions') as FormArray; }
  optionsFor(qi: number): FormArray {
    return this.questions.at(qi).get('options') as FormArray;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      // Edit mode — load existing activity
      this.isEditMode   = true;
      this.editActivity = this.service.getActivity(id);

      if (!this.editActivity) {
        this.router.navigate(['/activities']);
        return;
      }

      this.patchForm(this.editActivity);
    }
    // else: Create mode — form stays empty
  }

  // ── Patch form with existing data ────────────────────────────────────────

  private patchForm(activity: Activity): void {
    // 1. Patch simple fields
    this.form.patchValue({
      title:       activity.title,
      description: activity.description,
      type:        activity.type,
    });

    // 2. Rebuild questions FormArray
    this.questions.clear();
    activity.questions.forEach(q => {
      const optionsArray = this.fb.array(
        q.options.map(opt =>
          this.fb.group({ id: [opt.id], text: [opt.text, Validators.required] })
        )
      );

      this.questions.push(this.fb.group({
        text:          [q.text, Validators.required],
        type:          [q.type],
        options:       optionsArray,
        correctAnswer: [q.correctAnswer, Validators.required],
      }));
    });
  }

  // ── Question management ──────────────────────────────────────────────────

 addQuestion(): void {
  this.questions.push(this.fb.group({
    text:          ['', Validators.required],
    type:          ['mcq'],
    options:       this.fb.array([this.newOption(), this.newOption()]),
    correctAnswer: ['', Validators.required],
    grade:         [10, [Validators.required, Validators.min(0)]],  // ← add
    points:        [50, [Validators.required, Validators.min(0)]],  // ← add
  }));
}

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  onTypeChange(qi: number): void {
    const q    = this.questions.at(qi);
    const type = q.get('type')?.value;
    const opts = this.optionsFor(qi);

    opts.clear();
    q.get('correctAnswer')?.setValue('');

    if (type === 'mcq') {
      opts.push(this.newOption());
      opts.push(this.newOption());
    } else if (type === 'true-false') {
      opts.push(this.newOption('True'));
      opts.push(this.newOption('False'));
    }
  }

  // ── Option management ────────────────────────────────────────────────────

  private newOption(text = ''): FormGroup {
    return this.fb.group({ id: [crypto.randomUUID()], text: [text, Validators.required] });
  }

  addOption(qi: number): void { this.optionsFor(qi).push(this.newOption()); }

  removeOption(qi: number, oi: number): void { this.optionsFor(qi).removeAt(oi); }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.isEditMode && this.editActivity) {
      // UPDATE existing activity — keep original id and createdAt
      const updated: Activity = {
        ...this.editActivity,
        ...this.form.value,
      };
      this.service.updateActivity(updated);
    } else {
      // CREATE new activity
      this.service.createActivity(this.form.value);
    }

    this.router.navigate(['/activities']);
  }
}