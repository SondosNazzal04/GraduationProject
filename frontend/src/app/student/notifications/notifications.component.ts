import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, Notification } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-std-notifications', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./notifications.component.html', styleUrls:['./notifications.component.scss'] })
export class StudentNotificationsComponent implements OnInit {
  all=signal<Notification[]>([]); filter=signal('all');
  types=['all','academic','system','reward','message'];
  filtered=computed(()=>{ const n=this.all(); return this.filter()==='all'?n:n.filter(x=>x.type===this.filter()); });
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getNotifications().subscribe(n=>this.all.set(n)); }
  markAll():void{ this.all.update(list=>list.map(n=>({...n,read:true}))); }
  tc(t:string):string{const m:any={academic:'#1565C0',system:'#888',reward:'#9333ea',message:'#22c55e'};return m[t]||'#888';}
  tb(t:string):string{const m:any={academic:'#e3f2fd',system:'#f3f4f6',reward:'#f3e8ff',message:'#dcfce7'};return m[t]||'#f3f4f6';}
  get unread():number{return this.all().filter(n=>!n.read).length;}
}
