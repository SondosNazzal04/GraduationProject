import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

  onSignOut(): void {
    console.log('Sign out');
  }
}
