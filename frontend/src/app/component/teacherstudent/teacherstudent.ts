import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { Student } from '../../models/teacher.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AuthService } from '../../shared/services/auth/auth';

@Component({
  selector: 'app-teacherstudent',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './teacherstudent.html',
  styleUrls: ['./teacherstudent.scss']
})
export class Teacherstudent implements OnInit {
  students: Student[] = [];
  filtered: Student[] = [];
  searchQuery = '';
  selectedClass = 'all';
  classes = ['all', '7-A', '10-B'];
  teacherName = 'Mr. Smith';

  constructor(
    private teacherService: TeacherService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.teacherService.getStudents().subscribe(s => {
      this.students = s;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.filtered = this.students.filter(s => {
      const matchSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchClass  = this.selectedClass === 'all' || s.className === this.selectedClass;
      return matchSearch && matchClass;
    });
  }

  getGpaColor(gpa: number): string {
    if (gpa >= 3.7) return '#22c55e';
    if (gpa >= 3.0) return '#f59e0b';
    return '#ef4444';
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
