import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentPortalService } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-std-profile', standalone:true,
  imports:[CommonModule,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./profile.component.html', styleUrls:['./profile.component.scss'] })
export class StudentProfileComponent {
  constructor(public ps: StudentPortalService) {}
  gc(p:number):string{return p>=3.7?'#22c55e':p>=3.0?'#f59e0b':'#ef4444';}
  subjects=['Mathematics','English','Arabic','Science','History','Physics'];
  recentActs=[{title:'Math Problem Set',date:'2025-06-09',pts:50},{title:'English Essay',date:'2025-06-07',pts:100},{title:'Science Lab',date:'2025-06-05',pts:80}];
}
