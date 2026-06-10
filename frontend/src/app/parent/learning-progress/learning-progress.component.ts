import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, LearningProgress, ParentChild } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({ selector:'app-learning-progress', standalone:true,
  imports:[CommonModule,FormsModule,ParentSidebarComponent,TopbarComponent],
  templateUrl:'./learning-progress.component.html', styleUrls:['./learning-progress.component.scss'] })
export class LearningProgressComponent implements OnInit {
  children      = signal<ParentChild[]>([]);
  allProgress   = signal<LearningProgress[]>([]);
  selectedChild = signal('c1');
  filtered = computed(() => this.allProgress().filter(p => p.childId === this.selectedChild()));
  constructor(private ps: ParentService) {}
  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getLearningProgress().subscribe(p => this.allProgress.set(p));
  }
  gc(p:number):string { return p>=85?'#22c55e':p>=70?'#f59e0b':'#ef4444'; }
  trendBar(t:number[]):string {
    const max = Math.max(...t);
    return t.map((v,i)=>`${(i/(t.length-1))*100},${100-(v/max)*80}`).join(' ');
  }
}
