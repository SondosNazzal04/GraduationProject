import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, Achievement, ParentChild } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({ selector:'app-parent-achievements', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,ParentSidebarComponent,TopbarComponent],
  templateUrl:'./achievements.component.html', styleUrls:['./achievements.component.scss'] })
export class ParentAchievementsComponent implements OnInit {
  children      = signal<ParentChild[]>([]);
  allAchieve    = signal<Achievement[]>([]);
  selectedChild = signal('all');
  selectedType  = signal('all');
  types = ['all','badge','award','challenge','streak'];
  filtered = computed(() => {
    let a = this.allAchieve();
    if (this.selectedChild() !== 'all') a = a.filter(x => x.childId === this.selectedChild());
    if (this.selectedType()  !== 'all') a = a.filter(x => x.type   === this.selectedType());
    return a;
  });
  constructor(private ps: ParentService) {}
  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getAchievements().subscribe(a => this.allAchieve.set(a));
  }
  pct(a: Achievement): number { return Math.round((a.progress/a.maxProgress)*100); }
  typeColor(t:string):string { const m:any={badge:'#1565C0',award:'#f59e0b',challenge:'#9333ea',streak:'#22c55e'}; return m[t]||'#888'; }
  typeBg(t:string):string    { const m:any={badge:'#e3f2fd',award:'#fef3c7',challenge:'#f3e8ff',streak:'#dcfce7'}; return m[t]||'#f0f0f0'; }
}
