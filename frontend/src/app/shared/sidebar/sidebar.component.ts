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
    { label: 'Dashboard',    icon: 'dashboard',    route: '/teacher/dashboard',    active: false },
    { label: 'My Classes',   icon: 'classes',      route: '/teacher/classes',      active: true },
    { label: 'Students',     icon: 'students',     route: '/teacher/students',     active: true },
    { label: 'Attendance',   icon: 'attendance',   route: '/teacher/attendance',   active: true },
    { label: 'Gradebook',    icon: 'grades',       route: '/teacher/grades',       active: true },
    { label: 'Activities',   icon: 'activities',   route: '/teacher/activities',   active: false },
    { label: 'Messages',     icon: 'messages',     route: '/teacher/messages',     active: false },
    { label: 'Notifications',icon: 'notifications',route: '/teacher/notifications',active: false },
  ];

  onSignOut(): void {
    console.log('Sign out');
  }
}
