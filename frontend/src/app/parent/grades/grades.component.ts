import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, GradeRecord, ParentChild } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-parent-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, ParentSidebarComponent, TopbarComponent],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.scss']
})
export class ParentGradesComponent implements OnInit {
  children  = signal<ParentChild[]>([]);
  allGrades = signal<GradeRecord[]>([]);
  selectedChild = signal('all');

  filtered = computed(() => {
    const g = this.allGrades();
    return this.selectedChild() === 'all' ? g : g.filter(x => x.childId === this.selectedChild());
  });

  constructor(private ps: ParentService) {}
  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getGrades().subscribe(g => this.allGrades.set(g));
  }

  get avgGpa(): number {
    const ch = this.children();
    return ch.length ? Math.round((ch.reduce((s,c)=>s+c.gpa,0)/ch.length)*10)/10 : 0;
  }
  get highest(): number { const g = this.filtered(); return g.length ? Math.max(...g.map(x=>x.percentage)) : 0; }
  get lowest():  number { const g = this.filtered(); return g.length ? Math.min(...g.map(x=>x.percentage)) : 0; }
  get totalSubj():number { return new Set(this.filtered().map(x=>x.subject)).size; }

  gc(p:number):string { return p>=90?'#22c55e':p>=75?'#f59e0b':'#ef4444'; }
  gb(p:number):string { return p>=90?'#dcfce7':p>=75?'#fef3c7':'#fee2e2'; }
  gs(s:string):string { return s==='excellent'?'chip--blue':s==='pass'?'chip--green':'chip--red'; }
}
