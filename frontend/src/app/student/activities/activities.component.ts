import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, Activity } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';

@Component({ selector:'app-student-activities', standalone:true,
  imports:[CommonModule,FormsModule,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./activities.component.html', styleUrls:['./activities.component.scss'] })
export class StudentActivitiesComponent implements OnInit {
  all    = signal<Activity[]>([]);
  subj   = signal('all');
  diff   = signal('all');
  status = signal('all');
  subjects  = ['all','Mathematics','English','History','Science','Arabic','Physics'];
  diffs     = ['all','easy','medium','hard'];
  statuses  = ['all','not_started','in_progress','completed'];
  filtered  = computed(() => {
    let a = this.all();
    if (this.subj()   !== 'all') a = a.filter(x=>x.subject    === this.subj());
    if (this.diff()   !== 'all') a = a.filter(x=>x.difficulty === this.diff());
    if (this.status() !== 'all') a = a.filter(x=>x.status     === this.status());
    return a;
  });
  constructor(public ps: StudentPortalService) {}
  ngOnInit() { this.ps.getActivities().subscribe(a => this.all.set(a)); }
  gc(p:number):string { return p>=90?'#22c55e':p>=70?'#f59e0b':'#ef4444'; }
  dc(d:string):string { return d==='easy'?'chip--green':d==='medium'?'chip--amber':'chip--red'; }
  sc(s:string):string { const m:any={completed:'chip--green',in_progress:'chip--blue',not_started:'chip--amber'}; return m[s]||'chip--amber'; }
}
