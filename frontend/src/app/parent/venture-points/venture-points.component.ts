import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, VenturePointEntry, ParentChild } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({ selector:'app-venture-points', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,ParentSidebarComponent,TopbarComponent],
  templateUrl:'./venture-points.component.html', styleUrls:['./venture-points.component.scss'] })
export class VenturePointsComponent implements OnInit {
  children      = signal<ParentChild[]>([]);
  allEntries    = signal<VenturePointEntry[]>([]);
  selectedChild = signal('all');
  filtered = computed(() => {
    const e = this.allEntries();
    return this.selectedChild() === 'all' ? e : e.filter(x => x.childId === this.selectedChild());
  });
  constructor(private ps: ParentService) {}
  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getVenturePoints().subscribe(v => this.allEntries.set(v));
  }
  get totalEarned(): number { return this.filtered().filter(e=>e.type==='earned').reduce((s,e)=>s+e.points,0); }
  get totalSpent():  number { return Math.abs(this.filtered().filter(e=>e.type==='spent').reduce((s,e)=>s+e.points,0)); }
  get current():     number { return this.totalEarned - this.totalSpent; }
  gc(p:number):string { return p>0?'#22c55e':'#ef4444'; }
}
