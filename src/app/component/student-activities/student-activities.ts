import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Activity {
  id: number;
  title: string;
  subject: string;
  type: string;
  dueDate: string; // YYYY-MM-DD
  points: number;
  description?: string;
  
}

interface Submission {
  submitted: boolean;
  answer?: string;
  submittedAt?: string;
}

@Component({
  selector: 'app-student-activities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-activities.html',
  styleUrls: ['./student-activities.css'],
})
export class StudentActivities {
  // Optionally accept activities from parent. If not provided, we use mockActivities.
  @Input() activitiesInput?: Activity[];

  // fallback mock data
  mockActivities: Activity[] = [
    {
      id: 1,
      title: 'Chapter 5 Homework',
      subject: 'Math',
      type: 'Homework',
      dueDate: '2025-12-29',
      points: 50,
      description:
        'Solve exercises 1-10 on page 78. Show your work and submit scanned pages if needed.',
    },
    {
      id: 2,
      title: 'Chapter 4 Homework',
      subject: 'Arabic',
      type: 'Homework',
      dueDate: '2025-12-29',
      points: 50,
      description: 'Read chapter 4 and answer the comprehension questions at the end.',
    },
    {
      id: 3,
      title: 'Quiz #3',
      subject: 'Math',
      type: 'Quiz',
      dueDate: '2025-12-29',
      points: 20,
      description: 'In-class short quiz covering sections 3.1–3.4.',
    },
    {
      id: 4,
      title: 'Group Project',
      subject: 'Science',
      type: 'Project',
      dueDate: '2025-12-29',
      points: 100,
      description: 'Work in groups of 3. Prepare a short presentation and a report.',
    },
  ];

  // actual activities used by the component
  get activities(): Activity[] {
    return this.activitiesInput && this.activitiesInput.length
      ? this.activitiesInput
      : this.mockActivities;
  }

  // track submissions locally by activity id
  submissions: Record<number, Submission> = {};

  // UI state
  selected?: Activity | null;
  showDetailModal = false;
  answerText = '';

  // open activity detail
  openDetail(a: Activity) {
    this.selected = a;
    const s = this.submissions[a.id];
    this.answerText = s?.answer || '';
    this.showDetailModal = true;
  }

  closeDetail() {
    this.showDetailModal = false;
    this.selected = null;
    this.answerText = '';
  }

  // submit (student)
  submitActivity() {
    if (!this.selected) return;
    this.submissions[this.selected.id] = {
      submitted: true,
      answer: this.answerText?.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };
    // simple feedback
    alert('Your submission has been recorded.');
    this.closeDetail();
  }

  // helper: is submitted?
  isSubmitted(activityId: number): boolean {
    return !!this.submissions[activityId]?.submitted;
  }

  // helper: formatted date (simple)
  formatDate(d?: string): string {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString();
    } catch {
      return d;
    }
  }
}
