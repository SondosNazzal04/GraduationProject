import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, Assignment } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-student-assignments', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./assignments.component.html', styleUrls:['./assignments.component.scss'] })
export class StudentAssignmentsComponent implements OnInit {
  assignments = signal<Assignment[]>([]);
  selected = signal<Assignment|null>(null);
  constructor(public ps: StudentPortalService) {}
  ngOnInit() { this.ps.getAssignments().subscribe(a => this.assignments.set(a)); }
  sc(s:string):string{const m:any={pending:'chip--amber',submitted:'chip--blue',graded:'chip--green',late:'chip--red'};return m[s]||'chip--amber';}
  gc(p:number):string{return p>=90?'#22c55e':p>=75?'#f59e0b':'#ef4444';}
}
