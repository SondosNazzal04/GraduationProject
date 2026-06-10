import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, ClassInfo, ParentChild } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({ selector:'app-parent-classes', standalone:true,
  imports:[CommonModule,FormsModule,ParentSidebarComponent,TopbarComponent],
  templateUrl:'./classes.component.html', styleUrls:['./classes.component.scss'] })
export class ParentClassesComponent implements OnInit {
  children   = signal<ParentChild[]>([]);
  allClasses = signal<ClassInfo[]>([]);
  selectedChild = signal('all');
  filtered = computed(() => {
    const c = this.allClasses();
    return this.selectedChild() === 'all' ? c : c.filter(x => x.childId === this.selectedChild());
  });
  constructor(private ps: ParentService) {}
  ngOnInit() {
    this.ps.getChildren().subscribe(c => this.children.set(c));
    this.ps.getClasses().subscribe(c => this.allClasses.set(c));
  }
}
