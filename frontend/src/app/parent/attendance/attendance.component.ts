import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, AttendanceRecord, ParentChild } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, ParentSidebarComponent, TopbarComponent],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class ParentAttendanceComponent implements OnInit {
  children = signal<ParentChild[]>([]);
  allRecords = signal<AttendanceRecord[]>([]);
  selectedChild = signal('all');
  selectedMonth = signal('all');
  months = ['all','January','February','March','April','May','June'];

  filtered = computed(() => {
    let r = this.allRecords();
    if (this.selectedChild() !== 'all') r = r.filter(x => x.childId === this.selectedChild());
    return r;
  });

  constructor(private ps: ParentService) {}

  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getAttendance().subscribe(a => this.allRecords.set(a));
  }

  get presentCount():  number { return this.filtered().filter(r=>r.status==='present').length; }
  get absentCount():   number { return this.filtered().filter(r=>r.status==='absent').length; }
  get lateCount():     number { return this.filtered().filter(r=>r.status==='late').length; }
  get totalCount():    number { return this.filtered().length; }
  get presentPct():    number { return this.totalCount ? Math.round((this.presentCount/this.totalCount)*100) : 0; }

  sc(s:string) { return s==='present'?'#22c55e':s==='late'?'#f59e0b':'#ef4444'; }
  sb(s:string) { return s==='present'?'#dcfce7':s==='late'?'#fef3c7':'#fee2e2'; }
}
