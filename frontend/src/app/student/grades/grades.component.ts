import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { StudentPortalService, GradeEntry } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-std-grades', standalone:true,
  imports:[CommonModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./grades.component.html', styleUrls:['./grades.component.scss'] })
export class StudentGradesPageComponent implements OnInit {
  grades=signal<GradeEntry[]>([]);
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getGrades().subscribe(g=>this.grades.set(g)); }
  gc(p:number):string{return p>=90?'#22c55e':p>=75?'#f59e0b':'#ef4444';}
  gb(p:number):string{return p>=90?'#dcfce7':p>=75?'#fef3c7':'#fee2e2';}
  get highest():number{const g=this.grades();return g.length?Math.max(...g.map(x=>x.percentage)):0;}
  get lowest():number{const g=this.grades();return g.length?Math.min(...g.map(x=>x.percentage)):0;}
  get avg():number{const g=this.grades();return g.length?Math.round(g.reduce((s,x)=>s+x.percentage,0)/g.length):0;}
}
