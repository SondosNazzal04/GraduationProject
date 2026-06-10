import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { StudentPortalService, Challenge } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-challenges', standalone:true,
  imports:[CommonModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./challenges.component.html', styleUrls:['./challenges.component.scss'] })
export class StudentChallengesComponent implements OnInit {
  challenges=signal<Challenge[]>([]);
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getChallenges().subscribe(c=>this.challenges.set(c)); }
  pct(c:Challenge):number{return Math.round((c.progress/c.maxProgress)*100);}
  dc(d:string):string{return d==='easy'?'chip--green':d==='medium'?'chip--amber':'chip--red';}
  gc(p:number):string{return p>=80?'#22c55e':p>=50?'#1565C0':'#f59e0b';}
  join(id:string):void{ this.challenges.update(list=>list.map(c=>c.id===id?{...c,status:'joined' as const}:c)); }
}
