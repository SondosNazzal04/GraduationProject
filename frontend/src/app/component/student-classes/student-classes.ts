import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
import { StudentPortalService } from '../../services/student-portal.service';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { getApiBaseUrl } from '../../firebase.runtime-config';

export interface StudentClass {
  id: string;
  name: string;
  code: string;
  description: string;
  gradeLevel: string;
}

@Component({
  selector: 'app-student-classes',
  standalone: true,
  imports: [CommonModule, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './student-classes.html',
  styleUrls: ['./student-classes.css']
})
export class StudentClassesComponent implements OnInit {
  classes: StudentClass[] = [];
  isLoading = true;
  ps = inject(StudentPortalService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private baseUrl = getApiBaseUrl();

  ngOnInit(): void {
    this.loadClasses();
  }

  async loadClasses(): Promise<void> {
    try {
      this.isLoading = true;
      const res = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/api/student/me/classes`).pipe(timeout(10_000))
      );
      this.classes = res.items || [];
    } catch (e) {
      console.warn('Failed to load student classes', e);
      this.classes = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  viewClass(cls: StudentClass): void {
    this.router.navigate(['/studentactivities'], { queryParams: { classId: cls.id } });
  }
}
