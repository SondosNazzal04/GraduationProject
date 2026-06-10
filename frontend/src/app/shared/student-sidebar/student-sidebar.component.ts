import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
    { label: 'Dashboard',        icon: 'dashboard',   route: '/student/dashboard',        active: true  },
    { label: 'My Activities',    icon: 'activities',  route: '/student/activities',       active: true  },
    { label: 'Assignments',      icon: 'assignments', route: '/student/assignments',      active: true  },
    { label: 'Learning Summary', icon: 'summary',     route: '/student/learning-summary', active: true  },
    { label: 'Attendance',       icon: 'attendance',  route: '/student/attendance',       active: true  },
    { label: 'Grades',           icon: 'grades',      route: '/student/grades',           active: true  },
    { label: 'Achievements',     icon: 'achieve',     route: '/student/achievements',     active: true  },
    { label: 'Venture Points',   icon: 'vp',          route: '/student/venture-points',   active: true  },
    { label: 'Venture Shop',     icon: 'shop',        route: '/student/venture-shop',     active: true  },
    { label: 'Challenges',       icon: 'challenges',  route: '/student/challenges',       active: true  },
    { label: 'Badges',           icon: 'badges',      route: '/student/badges',           active: true  },
    { label: 'Messages',         icon: 'messages',    route: '/student/messages',         active: true  },
    { label: 'Notifications',    icon: 'notif',       route: '/student/notifications',    active: true  },
    { label: 'My Classes',       icon: 'classes',     route: '/student/my-classes',       active: true  },
    { label: 'Profile',          icon: 'profile',     route: '/student/profile',          active: true  },
    { label: 'Settings',         icon: 'settings',    route: '/student/settings',         active: true  },
  ];
  onSignOut(): void { console.log('Sign out'); }
}
