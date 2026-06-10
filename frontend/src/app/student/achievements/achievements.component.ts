import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, Achievement } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-std-achievements', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./achievements.component.html', styleUrls:['./achievements.component.scss'] })
export class StudentAchievementsComponent implements OnInit {
  all=signal<Achievement[]>([]); cat=signal('all');
  cats=['all','academic','attendance','participation','challenge'];
  filtered=computed(()=>{ const a=this.all(); return this.cat()==='all'?a:a.filter(x=>x.category===this.cat()); });
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getAchievements().subscribe(a=>this.all.set(a)); }
  tc(c:string):string{const m:any={academic:'chip--blue',attendance:'chip--green',participation:'chip--amber',challenge:'chip--purple'};return m[c]||'chip--blue';}
}
