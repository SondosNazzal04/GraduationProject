import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, ClassInfo, ParentChild } from '../../services/parent.service';
import { AuthService } from '../../shared/services/auth/auth';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-parent-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, ParentSidebarComponent, TopbarComponent],
  templateUrl: './parent-classes.html',
  styleUrls: ['./parent-classes.css']
})
export class ParentClasses implements OnInit {
  private ps = inject(ParentService);
  private authService = inject(AuthService);

  parentName = signal('Parent');
  children = signal<ParentChild[]>([]);
  allClasses = signal<ClassInfo[]>([]);
  selectedChild = signal('all');

  filtered = computed(() => {
    const c = this.allClasses();
    return this.selectedChild() === 'all' ? c : c.filter(x => x.childId === this.selectedChild());
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

    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getClasses().subscribe(c => this.allClasses.set(c));
  }

  onViewDetails(cls: ClassInfo) {
    alert(`Details for class: ${cls.name} are coming soon!`);
  }

  onContactTeacher(teacherName: string) {
    alert(`Messaging ${teacherName} is coming soon!`);
  }
}

