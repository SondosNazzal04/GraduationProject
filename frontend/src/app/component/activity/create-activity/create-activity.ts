import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup,
         FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ActivityService } from '../../../activity/services/activity';
import { Activity } from '../../../models/activity';
import { getApiBaseUrl } from '../../../firebase.runtime-config';

interface SchoolClass {
  id: string;
  name: string;
  code?: string;
  gradeLevel?: string;
}

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
  private http    = inject(HttpClient);

  isEditMode   = false;
  editActivity: Activity | undefined;
  form!: FormGroup;
  classes: SchoolClass[] = [];

  get questions(): FormArray { return this.form.get('questions') as FormArray; }

  optionsFor(qi: number): FormArray {
    return this.questions.at(qi).get('options') as FormArray;
  }

  ngOnInit(): void {
    // ★ ابني الفورم أول شي ★
    this.form = this.fb.group({
      title:       ['', Validators.required],
      description: [''],
      type:        ['quiz', Validators.required],
      classId:     [''],
      dueDate:     [''],
      timeLimit:   [null],
      questions:   this.fb.array([], Validators.required),
    });

    void this.loadClasses();

    // تحقق من edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode   = true;
      this.editActivity = this.service.getActivity(id);
      if (!this.editActivity) {
        this.router.navigate(['/activities']);
        return;
      }
      this.patchForm(this.editActivity);
    }
  }

  private patchForm(activity: Activity): void {
    this.form.patchValue({
      title:       activity.title,
      description: activity.description,
      type:        activity.type,
      classId:     activity.classId ?? '',
      dueDate:     activity.dueDate   ?? '',
      timeLimit:   activity.timeLimit ?? null,
    });

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
        grade:         [q.grade  ?? 10, [Validators.required, Validators.min(0)]],
        points:        [q.points ?? 50, [Validators.required, Validators.min(0)]],
      }));
    });
  }

  private async loadClasses(): Promise<void> {
    try {
      const json = await firstValueFrom<any>(this.http.get(`${getApiBaseUrl()}/api/admin/classes`));
      this.classes = Array.isArray(json.items) ? json.items : [];
    } catch {
      this.classes = [];
    }
  }

  addQuestion(): void {
    this.questions.push(this.fb.group({
      text:          ['', Validators.required],
      type:          ['mcq'],
      options:       this.fb.array([this.newOption(), this.newOption()]),
      correctAnswer: ['', Validators.required],
      grade:         [10, [Validators.required, Validators.min(0)]],
      points:        [50, [Validators.required, Validators.min(0)]],
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

  private newOption(text = ''): FormGroup {
    return this.fb.group({ id: [crypto.randomUUID()], text: [text, Validators.required] });
  }

  addOption(qi: number): void { this.optionsFor(qi).push(this.newOption()); }

  removeOption(qi: number, oi: number): void { this.optionsFor(qi).removeAt(oi); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.isEditMode && this.editActivity) {
      const updated: Activity = {
        ...this.editActivity,
        ...this.form.value,
        classId: this.form.value.classId || null,
      };
      this.service.updateActivity(updated);
    } else {
      this.service.createActivity({
        ...this.form.value,
        classId: this.form.value.classId || null,
      });
    }

    this.router.navigate(['/activities']);
  }
}
