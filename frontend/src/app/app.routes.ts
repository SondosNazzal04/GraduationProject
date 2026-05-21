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

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'change-password', component: ChangePassword },
  { path: 'parent-dashboard', component: ParentDashboard },
  { path: 'parent-attendance', component: ParentAttendance },
  { path: 'parent-grades', component: ParentGrades },
  { path: 'parent-classes', component: ParentClasses },
  { path: 'parent-children', component: ParentChildren },
  { path: 'teacherdachboard', component: TeacherDachboard },
  { path: 'teacherclasses', component: Teacherclasses },
  { path: 'teacherstudent', component: Teacherstudent },
  { path: 'teacherattendance', component: Teacherattendance },
  // { path: 'teacheractivities', component: TeacherActivity },
  //{ path: 'studentactivities', component: StudentActivities },
  { path: 'activities', component: ActivityListComponent },
  { path: 'activities/create', component: CreateActivityComponent },
  { path: 'activities/:id/take', component: TakeActivityComponent },
  // { path: '', redirectTo: 'activities', pathMatch: 'full' },
  { path: 'activities/:id/submissions', component: SubmissionsComponent },
  { path: 'studentactivities', component: StudentActivitiesComponent },
  { path: 'activities/:id/edit', component: CreateActivityComponent },
  { path: 'venture-shop', component: VentureShop },
  { path: 'admin-venture-shop', component: AdminVentureShop },
  { path: 'my-classes', component: MyClassesComponent },
  { path: 'attendance', component: AttendanceComponent },
  { path: 'gradebook', component: GradebookComponent },
];
