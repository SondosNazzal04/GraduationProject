import { Component, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

type NotifKey = 'grades'|'attendance'|'messages'|'achievements'|'events';

@Component({ selector:'app-parent-settings', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,ParentSidebarComponent,TopbarComponent],
  templateUrl:'./settings.component.html', styleUrls:['./settings.component.scss'] })
export class ParentSettingsComponent {
  activeTab = signal('profile');
  tabs = [
    {id:'profile',label:'Profile'},
    {id:'password',label:'Password'},
    {id:'notifications',label:'Notifications'},
    {id:'language',label:'Language'},
    {id:'security',label:'Security'},
  ];
  profile = { firstName:'Omar', lastName:'Rami', email:'omar.rami@email.com', phone:'+962-77-1234567' };
  password = { current:'', newPass:'', confirm:'' };
  notifKeys: NotifKey[] = ['grades','attendance','messages','achievements','events'];
  notifPrefs: Record<NotifKey,boolean> = { grades:true, attendance:true, messages:true, achievements:true, events:false };
  language = signal('en');
  saved = signal(false);
  saveProfile():void { this.saved.set(true); setTimeout(()=>this.saved.set(false),2500); }
  getNotif(k:NotifKey):boolean { return this.notifPrefs[k]; }
  setNotif(k:NotifKey,v:boolean):void { this.notifPrefs[k] = v; }
}
