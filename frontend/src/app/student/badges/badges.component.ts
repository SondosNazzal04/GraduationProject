import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentPortalService, Badge } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-badges', standalone:true,
  imports:[CommonModule,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./badges.component.html', styleUrls:['./badges.component.scss'] })
export class StudentBadgesComponent implements OnInit {
  badges=signal<Badge[]>([]);
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getBadges().subscribe(b=>this.badges.set(b)); }
  get earned():Badge[]{return this.badges().filter(b=>b.earned);}
  get locked():Badge[]{return this.badges().filter(b=>!b.earned);}
}
