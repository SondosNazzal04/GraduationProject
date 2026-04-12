// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { InterfacesActivity } from '../../interfaces/interfaces-activity';

// @Component({
//   selector: 'app-activities',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
  //  templateUrl: './teacher-activities.html',
  // styleUrls: ['./teacher-activities.css'],
// })
// export class TeacherActivities {
//   activities: InterfacesActivity[] = [
//     {
//       id: 1,
//       title: 'Chapter 5 Homework',
//       subject: 'Math',
//       type: 'Home work',
//       dueDate: '2025-12-29',
//       points: 50,
//       description: undefined,
//     },
//     {
//       id: 2,
//       title: 'Chapter 4 Homework',
//       subject: 'Arabic',
//       type: 'Home work',
//       dueDate: '2025-12-29',
//       points: 50,
//       description: undefined,
//     },
//     {
//       id: 3,
//       title: 'Quiz #3',
//       subject: 'Math',
//       type: 'Quiz',
//       dueDate: '2025-12-29',
//       points: 50,
//       description: undefined,
//     },
//     {
//       id: 4,
//       title: 'Group Project',
//       subject: 'Science',
//       type: 'Project',
//       dueDate: '2025-12-29',
//       points: 50,
//       description: undefined,
//     },
//   ];

//   showModal = false;
//   isEditing = false;
//   current: InterfacesActivity = this.emptyActivity();

//   private nextId(): number {
//     return this.activities.length ? Math.max(...this.activities.map((a) => a.id)) + 1 : 1;
//   }

//   emptyActivity(): InterfacesActivity {
//     return {
//       id: 0,
//       title: '',
//       subject: '',
//       type: 'Home work',
//       dueDate: this.todayISO(),
//       points: 0,
//       description: undefined,
//     };
//   }

//   todayISO(): string {
//     const d = new Date();
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     const dd = String(d.getDate()).padStart(2, '0');
//     return `${d.getFullYear()}-${mm}-${dd}`;
//   }

//   openCreate(): void {
//     this.isEditing = false;
//     this.current = this.emptyActivity();
//     this.showModal = true;
//   }

//   openEdit(a: InterfacesActivity): void {
//     this.isEditing = true;
//     this.current = { ...a };
//     this.showModal = true;
//   }

//   closeModal(): void {
//     this.showModal = false;
//   }

//   save(): void {
//     if (!this.current.title || !this.current.title.trim()) return;

//     if (this.isEditing) {
//       this.activities = this.activities.map((x) =>
//         x.id === this.current.id ? { ...this.current } : x,
//       );
//     } else {
//       const newItem = { ...this.current, id: this.nextId() };
//       this.activities = [newItem, ...this.activities];
//     }

//     this.closeModal();
//   }

//   deleteActivity(a: InterfacesActivity): void {
//     const ok = confirm(`Are you sure you want to delete "${a.title}"?`);
//     if (!ok) return;
//     this.activities = this.activities.filter((x) => x.id !== a.id);
//   }

//   trackById(index: number, item: InterfacesActivity): number {
//     return item.id;
//   }
// }
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-activity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], // ✅ أضفهم هنا
     templateUrl: './teacher-activities.html',
  styleUrls: ['./teacher-activities.css'],
})
export class TeacherActivityComponent {

removeQuestion(_t63: any) {
throw new Error('Method not implemented.');
}
  showCreateForm = false; // للتحكم في ظهور/إخفاء الفورم
  activities: any[] = [];
  questions: any[] = [];
  activityForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  initializeForm() {
    this.activityForm = this.fb.group({
      title: ['', Validators.required],
      subject: ['', Validators.required],
      type: ['quiz', Validators.required],
      dueDate: ['', Validators.required],
      questionText: [''],
      questionType: ['multiple-choice'],
      points: [1, Validators.required],
      options: [''],
      correctAnswer: ['']
    });
  }

  // فتح نموذج الإضافة
  openCreateForm() {
    this.showCreateForm = true;
  }

  // إغلاق النموذج
  closeCreateForm() {
    this.showCreateForm = false;
    this.questions = [];
    this.activityForm.reset();
  }

  // إضافة سؤال
  addQuestion() {
    // ... نفس الكود السابق
  }

  // إنشاء النشاط
  submitActivity() {
    // ... نفس الكود السابق
  }
}