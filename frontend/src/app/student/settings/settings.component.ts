import { Component, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';

type NKey = 'grades'|'achievements'|'messages'|'challenges'|'events';

@Component({ selector:'app-std-settings', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./settings.component.html', styleUrls:['./settings.component.scss'] })
export class StudentSettingsComponent {
  tab = signal('personal'); saved = signal(false);
  tabs = [{id:'personal',label:'Personal Info'},{id:'password',label:'Password'},{id:'notifications',label:'Notifications'},{id:'language',label:'Language'},{id:'privacy',label:'Privacy'}];
  profile = {name:'Sara Ahmad',email:'sara.ahmad@eduventure.edu',phone:'+962-77-1234567',bio:'Dedicated student with a passion for mathematics.'};
  password = {current:'',newPass:'',confirm:''};
  nkeys: NKey[] = ['grades','achievements','messages','challenges','events'];
  notifs: Record<NKey,boolean> = {grades:true,achievements:true,messages:true,challenges:true,events:false};
  lang = signal('en');
  showProfile = signal(true);
  showActivity = signal(false);

  constructor(public ps: StudentPortalService) {}

  save(): void { this.saved.set(true); setTimeout(()=>this.saved.set(false),2500); }
  gn(k:NKey): boolean { return this.notifs[k]; }
  sn(k:NKey, v:boolean): void { this.notifs[k]=v; }
  setShowProfile(v:boolean): void { this.showProfile.set(v); }
  setShowActivity(v:boolean): void { this.showActivity.set(v); }
}
