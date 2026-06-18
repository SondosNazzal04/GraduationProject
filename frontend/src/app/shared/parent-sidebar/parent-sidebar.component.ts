import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth/auth';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-parent-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './parent-sidebar.component.html',
  styleUrls: ['./parent-sidebar.component.scss']
})
export class ParentSidebarComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',        icon: 'dashboard',   route: '/parent-dashboard'        },
    { label: 'My Children',      icon: 'children',    route: '/parent-children'      },
    { label: 'Attendance',       icon: 'attendance',  route: '/parent-attendance'       },
    { label: 'Grades',           icon: 'grades',      route: '/parent-grades'           },
    { label: 'Classes',          icon: 'classes',     route: '/parent-classes'          },

    { label: 'Notifications',    icon: 'notif',       route: '/parent-notifications'    },
    { label: 'Messages',         icon: 'messages',    route: '/parent-messages'         },
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


