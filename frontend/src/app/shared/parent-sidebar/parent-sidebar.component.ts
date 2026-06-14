import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

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
    { label: 'Achievements',     icon: 'achieve',     route: '/parent-achievements'     },
    { label: 'Notifications',    icon: 'notif',       route: '/parent-notifications'    },
    { label: 'Messages',         icon: 'messages',    route: '/parent-messages'         },
    { label: 'Teachers',         icon: 'teachers',    route: '/parent-teachers'         },
    { label: 'Learning Progress',icon: 'progress',    route: '/parent-learning-progress'},
    { label: 'Venture Points',   icon: 'vp',          route: '/parent-venture-points'   },
    { label: 'Rewards History',  icon: 'rewards',     route: '/parent-rewards-history'  },
    { label: 'Settings',         icon: 'settings',    route: '/parent-settings'         },
  ];

  onSignOut(): void { console.log('Sign out'); }
}
