import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService, Teacher } from '../../services/parent.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({ selector:'app-parent-teachers', standalone:true,
  imports:[CommonModule,FormsModule,ParentSidebarComponent,TopbarComponent],
  templateUrl:'./teachers.component.html', styleUrls:['./teachers.component.scss'] })
export class ParentTeachersComponent implements OnInit {
  teachers = signal<Teacher[]>([]);
  query    = signal('');
  constructor(private ps: ParentService) {}
  ngOnInit() { this.ps.getTeachers().subscribe(t => this.teachers.set(t)); }
  get filtered(): Teacher[] {
    const q = this.query().toLowerCase();
    return this.teachers().filter(t => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
  }
  colors = ['#f06292','#1565C0','#9333ea','#22c55e','#f59e0b','#ef4444','#0891b2','#7c3aed','#059669'];
  color(i:number):string { return this.colors[i % this.colors.length]; }
}
