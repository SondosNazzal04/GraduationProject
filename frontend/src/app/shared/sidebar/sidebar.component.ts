import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  navItems = [
    { label: 'Dashboard',    icon: 'dashboard',    route: '/teacher-dashboard',    active: false },
    { label: 'My Classes',   icon: 'classes',      route: '/my-classes',      active: true },
    { label: 'Students',     icon: 'students',     route: '/teacherstudent',     active: true },
    { label: 'Attendance',   icon: 'attendance',   route: '/attendance',   active: true },
    { label: 'Gradebook',    icon: 'grades',       route: '/gradebook',       active: true },
    { label: 'Activities',   icon: 'activities',   route: '/activities',   active: false },
    { label: 'Messages',     icon: 'messages',     route: '/messages',     active: false },
    { label: 'Notifications',icon: 'notifications',route: '/notifications',active: false },
  ];

  onSignOut(): void {
    console.log('Sign out');
  }
}
