import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, GradeRecord, ParentChild } from '../../services/parent.service';
import { AuthService } from '../../shared/services/auth/auth';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-parent-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, ParentSidebarComponent, TopbarComponent],
  templateUrl: './parent-grades.html',
  styleUrls: ['./parent-grades.scss']
})
export class ParentGrades implements OnInit {
  private ps = inject(ParentService);
  private authService = inject(AuthService);

  parentName = signal('Parent');
  children = signal<ParentChild[]>([]);
  allGrades = signal<GradeRecord[]>([]);
  selectedChild = signal('all');
  loading = signal(true);

  filtered = computed(() => {
    const g = this.allGrades();
    return this.selectedChild() === 'all' ? g : g.filter(x => x.childId === this.selectedChild());
  });

  async ngOnInit() {
    try {
      const profile = await this.authService.getParentProfile();
      if (profile) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        if (firstName || lastName) {
          this.parentName.set(`${firstName} ${lastName}`.trim());
        } else if (profile.email) {
          this.parentName.set(profile.email.split('@')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching parent profile:', err);
    }

    this.ps.getChildren().subscribe(children => {
      this.children.set(children);
      
      if (!children || children.length === 0) {
        this.loading.set(false);
        return;
      }

      const gradeRequests = children.map(c => this.ps.getGrades(c.id).pipe(catchError(() => of([]))));
      forkJoin(gradeRequests).subscribe({
        next: (gradesArray) => {
          const all = gradesArray.flat();
          this.allGrades.set(all);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load grades', err);
          this.loading.set(false);
        }
      });
    });
  }

  get avgGpa(): number {
    const g = this.allGrades();
    return g.length ? Math.round((g.reduce((s, x) => s + x.percentage, 0) / g.length) * 10) / 10 : 0;
  }

  getChildName(childId: string): string {
    const child = this.children().find(c => c.id === childId);
    return child ? `${child.firstName} ${child.lastName}`.trim() : 'Child';
  }

  get highest(): number {
    const g = this.filtered();
    return g.length ? Math.max(...g.map(x => x.percentage)) : 0;
  }

  get lowest(): number {
    const g = this.filtered();
    return g.length ? Math.min(...g.map(x => x.percentage)) : 0;
  }

  get totalSubj(): number {
    return new Set(this.filtered().map(x => x.subject)).size;
  }

  gc(p: number): string {
    return p >= 90 ? '#22c55e' : p >= 75 ? '#f59e0b' : '#ef4444';
  }

  gb(p: number): string {
    return p >= 90 ? '#dcfce7' : p >= 75 ? '#fef3c7' : '#fee2e2';
  }

  gs(s: string): string {
    return s === 'excellent' ? 'chip--blue' : s === 'pass' ? 'chip--green' : 'chip--red';
  }
}


