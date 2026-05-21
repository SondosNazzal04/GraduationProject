import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../activity/services/activity';
import { Activity, Submission } from '../../../models/activity';

@Component({
  selector: 'app-submissions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './submissions.html',
})
export class SubmissionsComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  service         = inject(ActivityService);

  activity: Activity | undefined;
  submissions: Submission[] = [];
  expandedId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.activity    = this.service.getActivity(id);
    this.submissions = this.service.getSubmissionsForActivity(id);
  }

  toggle(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getQuestionText(questionId: string): string {
    return this.activity?.questions.find(q => q.id === questionId)?.text ?? questionId;
  }

  averageGrade(): number {
    const graded = this.submissions.filter(s => s.grade !== undefined);
    if (!graded.length) return 0;
    return Math.round(graded.reduce((sum, s) => sum + (s.grade ?? 0), 0) / graded.length);
  }
}