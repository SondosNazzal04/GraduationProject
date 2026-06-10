import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { Student } from '../../models/teacher.model';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss']
})
export class StudentsComponent implements OnInit {
  students: Student[] = [];
  filtered: Student[] = [];
  searchQuery = '';
  selectedClass = 'all';
  classes = ['all', '7-A', '10-B'];

  constructor(private teacherService: TeacherService) {}

  ngOnInit(): void {
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
}
