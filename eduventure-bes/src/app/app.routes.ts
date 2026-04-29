import { Routes } from '@angular/router';
import { MyClassesComponent } from './pages/my-classes/my-classes.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { GradebookComponent } from './pages/gradebook/gradebook.component';

export const routes: Routes = [
  { path: '', redirectTo: 'my-classes', pathMatch: 'full' },
  { path: 'my-classes', component: MyClassesComponent },
  { path: 'attendance', component: AttendanceComponent },
  { path: 'gradebook', component: GradebookComponent },
  { path: '**', redirectTo: 'my-classes' }
];
