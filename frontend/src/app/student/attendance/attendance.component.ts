import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, AttendanceRecord } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-std-attendance', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./attendance.component.html', styleUrls:['./attendance.component.scss'] })
export class StudentAttendancePageComponent implements OnInit {
  all=signal<AttendanceRecord[]>([]);filterSubj=signal('all');
  subjects=['all','Mathematics','English','History','Arabic','Science','Physics'];
  filtered=computed(()=>{ const a=this.all(); return this.filterSubj()==='all'?a:a.filter(x=>x.subject===this.filterSubj()); });
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getAttendance().subscribe(a=>this.all.set(a)); }
  sc(s:string):string{return s==='present'?'chip--green':s==='late'?'chip--amber':'chip--red';}
  sb(s:string):string{return s==='present'?'#dcfce7':s==='late'?'#fef3c7':'#fee2e2';}
  scolor(s:string):string{return s==='present'?'#166534':s==='late'?'#92400e':'#991b1b';}
  get presentPct():number{ const t=this.all().length; return t?Math.round((this.ps.presentDays/t)*100):0; }
}
