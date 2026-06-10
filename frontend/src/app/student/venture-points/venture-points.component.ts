import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { StudentPortalService, VPEntry } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-std-vp', standalone:true,
  imports:[CommonModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./venture-points.component.html', styleUrls:['./venture-points.component.scss'] })
export class StudentVenturePointsComponent implements OnInit {
  history=signal<VPEntry[]>([]);
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getVPHistory().subscribe(v=>this.history.set(v)); }
  gc(p:number):string{return p>0?'#22c55e':'#ef4444';}
  barH(v:number,max:number):number{return(v/max)*70;}
}
