import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherService } from '../../../services/teacher.service';
import { ClassRoom } from '../../../models/teacher.model';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { AuthService } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-teacherclasses',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent],
  templateUrl: './teacherclasses.html',
  styleUrls: ['./teacherclasses.scss']
})
export class Teacherclasses implements OnInit {
  classes: ClassRoom[] = [];
  selectedClass: ClassRoom | null = null;
  teacherName = 'Mr. Smith';

  constructor(
    private teacherService: TeacherService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
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
