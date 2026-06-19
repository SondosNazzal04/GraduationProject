import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './student-sidebar.component.html',
  styleUrls: ['./student-sidebar.component.scss']
})
export class StudentSidebarComponent {
  navItems = [
    { label: 'Dashboard',        icon: 'dashboard',   route: '/student-dashboard',        active: true  },
    { label: 'My Quests',        icon: 'assignments', route: '/studentactivities',        active: true  },
    { label: 'Achievements',     icon: 'achieve',     route: '/student-achievements',     active: true  },
    { label: 'Grades',           icon: 'grades',      route: '/student-grades',           active: true  },
    { label: 'Venture Shop',     icon: 'shop',        route: '/venture-shop',             active: true  },
    { label: 'My Classes',       icon: 'classes',     route: '/student-classes',          active: true  },
    { label: 'Messages',         icon: 'messages',    route: '/student-messages',         active: true  },
    { label: 'Notifications',    icon: 'notif',       route: '/student-notifications',    active: true  },
  ];
  private authService = inject(AuthService);
  private router = inject(Router);

  async onSignOut(): Promise<void> {
    try {
      this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}


