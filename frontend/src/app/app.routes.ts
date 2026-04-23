import { Routes } from "@angular/router";
import { Login } from "./features/auth/login/login";


import { ParentAttendance } from './parents/parent-attendance/parent-attendance';
import { ParentGrades } from './parents/parent-grades/parent-grades';
import { ParentClasses } from './parents/parent-classes/parent-classes';
import { ParentDashboard } from './parents/parent-dashboard/parent-dashboard';
import { ParentChildren } from "./parents/parent-children/parent-children";
import { ChangePassword } from "./features/auth/login/change-password/change-password";

export const routes: Routes = [
  { path: 'login', component: Login},
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'parent-dashboard', component: ParentDashboard },
  { path: 'parent-attendance', component: ParentAttendance },
  { path: 'parent-grades', component: ParentGrades },
  { path: 'parent-classes', component: ParentClasses },
  { path: 'parent-children', component: ParentChildren},
  { path: 'change-password', component: ChangePassword}
];



