import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ParentService, ParentChild, SchoolEvent } from '../../services/parent.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, RouterLink, ParentSidebarComponent, TopbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class ParentDashboardComponent implements OnInit {
  children = signal<ParentChild[]>([]);
  events = signal<SchoolEvent[]>([]);
  selectedId = signal('c1');

  recentActivity = [
    { icon:'assignment', color:'#1565C0', bg:'#e3f2fd', text:'Completed Math Homework', child:'Rama Omar',  time:'3 hours ago'  },
    { icon:'badge',      color:'#9333ea', bg:'#f3e8ff', text:"Earned 'Perfect Week' badge",child:'Rama Omar',time:'Yesterday'    },
    { icon:'streak',     color:'#f59e0b', bg:'#fef3c7', text:'Achieved 5-day streak',   child:'Ali Omar',   time:'Yesterday'    },
    { icon:'grade',      color:'#22c55e', bg:'#dcfce7', text:'Scored 95% on Science',   child:'Ali Omar',   time:'2 days ago'   },
    { icon:'attend',     color:'#ef4444', bg:'#fee2e2', text:'Absence recorded',         child:'Rama Omar',  time:'3 days ago'   },
  ];

  attendanceTrend = [
    {month:'Jan',pct:92},{month:'Feb',pct:95},{month:'Mar',pct:88},
    {month:'Apr',pct:97},{month:'May',pct:98},{month:'Jun',pct:95},
  ];
  maxTrend = 100;

  constructor(private ps: ParentService) {}

  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getEvents().subscribe(e => this.events.set(e));
  }

  get selected(): ParentChild | undefined {
    return this.children().find(c => c.id === this.selectedId());
  }

  get avgGpa(): number {
    const ch = this.children();
    if (!ch.length) return 0;
    return Math.round((ch.reduce((s,c) => s + c.gpa, 0) / ch.length) * 10) / 10;
  }

  get avgAttendance(): number {
    const ch = this.children();
    if (!ch.length) return 0;
    return Math.round(ch.reduce((s,c) => s + c.attendancePct, 0) / ch.length);
  }

  get totalVP(): number {
    return this.children().reduce((s,c) => s + c.venturePoints, 0);
  }

  getGpaColor(gpa: number): string {
    return gpa >= 3.7 ? '#22c55e' : gpa >= 3.0 ? '#f59e0b' : '#ef4444';
  }

  barHeight(pct: number): number { return (pct / this.maxTrend) * 80; }
}
