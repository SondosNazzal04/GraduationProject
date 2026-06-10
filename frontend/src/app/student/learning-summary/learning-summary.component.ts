import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentPortalService } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-learning-summary', standalone:true,
  imports:[CommonModule,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./learning-summary.component.html', styleUrls:['./learning-summary.component.scss'] })
export class StudentLearningSummaryComponent implements OnInit {
  monthlyProgress = [65,70,74,78,82,88,91];
  quizResults     = [80,85,90,88,92,95];
  assignSuccess   = 88;
  completionRate  = 92;
  semesterProg    = 72;
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){}
  gc(p:number):string{return p>=85?'#22c55e':p>=70?'#f59e0b':'#ef4444';}
  barH(v:number,max:number):number{return(v/max)*70;}
}
