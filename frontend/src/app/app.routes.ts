import { Routes } from '@angular/router';
import { TeacherDachboard } from './component/teacher-dachboard/teacher-dachboard';
import { Teacherclasses } from './component/teacher/teacherclasses/teacherclasses';
import { Teacherstudent } from './component/teacherstudent/teacherstudent';
import { Teacherattendance } from './component/teacher/teacherattendance/teacherattendance';
//import { Studentctivities } from './component/student-activities/student-activities';
//import { TeacherActivity } from './component/teacher-activities/teacher-activities';
import { CreateActivityComponent } from './component/activity/create-activity/create-activity';
import { TakeActivityComponent } from './component/activity/take-activity/take-activity';
import { ActivityListComponent } from './component/activity/activity-list/activity-list';
import { SubmissionsComponent } from './component/activity/submissions/submissions';
import { StudentActivitiesComponent } from './component/student-activities/student-activities';
import { VentureShop } from './student/venture-shop/venture-shop';
import { AdminVentureShop } from './admin/admin-venture-shop/admin-venture-shop';
import { AdminUsersComponent } from './admin/admin-users/admin-users';
import { MyClassesComponent } from './pages/my-classes/my-classes.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { GradebookComponent } from './pages/gradebook/gradebook.component';
import { Login } from './features/auth/login/login';
import { ParentAttendance } from './parents/parent-attendance/parent-attendance';
import { ParentGrades } from './parents/parent-grades/parent-grades';
import { ParentClasses } from './parents/parent-classes/parent-classes';
import { ParentDashboard } from './parents/parent-dashboard/parent-dashboard';
import { ParentChildren } from './parents/parent-children/parent-children';
import { ChangePassword } from './features/auth/login/change-password/change-password';
import { StudentDashboard } from './component/student-dashboard/student-dashboard';
import { StudentClassesComponent } from './component/student-classes/student-classes';
import { AdminDashboard } from './component/admin-dashboard/admin-dashboard';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { DirectMessages } from './shared/direct-messages/direct-messages';

export const routes: Routes = [
  // ── Public routes ──────────────────────────────────────────────
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'change-password', component: ChangePassword },

  // ── Student routes ─────────────────────────────────────────────
  {
    path: 'student-dashboard',
    component: StudentDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
  },
  {
    path: 'studentactivities',
    component: StudentActivitiesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
  },
  {
    path: 'venture-shop',
    component: VentureShop,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
  },
  {
    path: 'activities/:id/take',
    component: TakeActivityComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
  },
  {
    path: 'student-messages',
    component: DirectMessages,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
  },
  {
    path: 'student-classes',
    component: StudentClassesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
  },

  // ── Teacher routes ─────────────────────────────────────────────
  {
    path: 'teacher-dashboard',
    component: TeacherDachboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'teacherclasses',
    component: Teacherclasses,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'teacherstudent',
    component: Teacherstudent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'teacherattendance',
    component: Teacherattendance,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'activities',
    component: ActivityListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'activities/create',
    component: CreateActivityComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'activities/:id/submissions',
    component: SubmissionsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'activities/:id/edit',
    component: CreateActivityComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'my-classes',
    component: MyClassesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'attendance',
    component: AttendanceComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },
  {
    path: 'gradebook',
    component: GradebookComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
  },

  // ── Admin routes ───────────────────────────────────────────────
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin-users',
    component: AdminUsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin-venture-shop',
    component: AdminVentureShop,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },

  // ── Parent routes ──────────────────────────────────────────────
  {
    path: 'parent-dashboard',
    component: ParentDashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['parent'] },
  },
  {
    path: 'parent-attendance',
    component: ParentAttendance,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['parent'] },
  },
  {
    path: 'parent-grades',
    component: ParentGrades,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['parent'] },
  },
  {
    path: 'parent-classes',
    component: ParentClasses,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['parent'] },
  },
  {
    path: 'parent-children',
    component: ParentChildren,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['parent'] },
  },
];



