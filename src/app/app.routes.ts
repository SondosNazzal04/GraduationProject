import { Routes } from '@angular/router';
import { Login } from './component/login/login';
import { TeacherDachboard } from './component/teacher/teacher-dachboard/teacher-dachboard';
import { Teacherclasses } from './component/teacher/teacherclasses/teacherclasses';
import { Teacherstudent } from './component/teacher/add-questions/teacherstudent/teacherstudent';
import { Teacherattendance } from './component/teacher/teacherattendance/teacherattendance';
import { TeacherActivities } from './component/teacher-activities/teacher-activities';
import { StudentActivities } from './component/student-activities/student-activities';
//import { AddQuestions } from './component/teacher/add-questions/add-questions';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'teacherdachboard', component: TeacherDachboard },
  { path: 'teacherclasses', component: Teacherclasses },
  { path: 'teacherstudent', component: Teacherstudent },
  { path: 'teacherattendance', component: Teacherattendance },
  { path: 'teacheractivites', component: TeacherActivities },
  { path: 'studentactivitie', component: StudentActivities },
  // { path: 'addquestions', component: AddQuestions },
];
