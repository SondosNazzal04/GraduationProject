import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/teacher-dashboard', active: true },
    { label: 'My Classes', icon: 'classes', route: '/my-classes', active: true },

    { label: 'Attendance', icon: 'attendance', route: '/attendance', active: true },
    { label: 'Gradebook', icon: 'grades', route: '/gradebook', active: true },
    { label: 'Activities', icon: 'activities', route: '/activities', active: true },
    { label: 'Messages', icon: 'messages', route: '/teacher-messages', active: true },
    { label: 'Notifications', icon: 'notifications', route: '/teacher-notifications', active: true },
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


