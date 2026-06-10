import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherService } from '../../services/teacher.service';
import { ClassRoom } from '../../models/teacher.model';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss']
})
export class ClassesComponent implements OnInit {
  classes: ClassRoom[] = [];
  selectedClass: ClassRoom | null = null;

  constructor(private teacherService: TeacherService) {}

  ngOnInit(): void {
    this.teacherService.getClasses().subscribe(c => {
      this.classes = c;
      if (c.length) this.selectedClass = c[0];
    });
  }

  selectClass(c: ClassRoom): void {
    this.selectedClass = c;
  }

  getStudentsForClass(classId: string) {
    return this.teacherService.getStudentsByClass(classId);
  }
}
