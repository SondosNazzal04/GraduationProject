import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentService, StudentClass } from '../../services/student.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-my-classes',
  standalone: true,
  imports: [CommonModule, StudentSidebarComponent, TopbarComponent],
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.scss']
})
export class MyClassesComponent implements OnInit {
  classes: StudentClass[] = [];

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.studentService.getMyClasses().subscribe(c => this.classes = c);
  }

  getProgressColor(pct: number): string {
    if (pct >= 85) return '#1565C0';
    if (pct >= 70) return '#f59e0b';
    return '#ef4444';
  }

  getGradeColor(score: number): string {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#f59e0b';
    return '#ef4444';
  }
}
