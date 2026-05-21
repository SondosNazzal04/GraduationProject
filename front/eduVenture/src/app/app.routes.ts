import { Routes } from "@angular/router";


import { ParentAttendance } from './parents/parent-attendance/parent-attendance';
import { ParentGrades } from './parents/parent-grades/parent-grades';
import { ParentClasses } from './parents/parent-classes/parent-classes';
import { ParentDashboard } from './parents/parent-dashboard/parent-dashboard';
import { ParentChildren } from "./parents/parent-children/parent-children";
import { VentureShop } from "./student/venture-shop/venture-shop";
import { AdminVentureShop } from "./admin/admin-venture-shop/admin-venture-shop";

export const routes: Routes = [
  { path: '', redirectTo: '/parent-dashboard', pathMatch: 'full' },
  { path: 'parent-dashboard', component: ParentDashboard },
  { path: 'parent-attendance', component: ParentAttendance },
  { path: 'parent-grades', component: ParentGrades },
  { path: 'parent-classes', component: ParentClasses },
  { path: 'parent-children', component: ParentChildren},
  { path: 'venture-shop', component: VentureShop },
  { path: 'admin-venture-shop', component: AdminVentureShop },
];



