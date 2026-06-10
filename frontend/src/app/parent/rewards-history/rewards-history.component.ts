import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, RewardEntry, ParentChild } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({ selector:'app-rewards-history', standalone:true,
  imports:[CommonModule,FormsModule,TitleCasePipe,ParentSidebarComponent,TopbarComponent],
  templateUrl:'./rewards-history.component.html', styleUrls:['./rewards-history.component.scss'] })
export class RewardsHistoryComponent implements OnInit {
  children      = signal<ParentChild[]>([]);
  allRewards    = signal<RewardEntry[]>([]);
  selectedChild = signal('all');
  filtered = computed(() => {
    const r = this.allRewards();
    return this.selectedChild() === 'all' ? r : r.filter(x => x.childId === this.selectedChild());
  });
  constructor(private ps: ParentService) {}
  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getRewards().subscribe(r => this.allRewards.set(r));
  }
  sc(s:string):string { return s==='active'?'chip--green':s==='used'?'chip--blue':'chip--amber'; }
}
