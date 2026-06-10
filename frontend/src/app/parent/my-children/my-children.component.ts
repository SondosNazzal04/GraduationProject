import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Child } from '../../models/child.model';
import { ChildService } from '../../services/child.service';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-my-children',
  standalone: true,
  imports: [CommonModule, ParentSidebarComponent, TopbarComponent],
  templateUrl: './my-children.component.html',
  styleUrls: ['./my-children.component.scss']
})
export class MyChildrenComponent implements OnInit {
  children$!: Observable<Child[]>;

  constructor(private childService: ChildService) {}

  ngOnInit(): void {
    this.children$ = this.childService.getChildren();
  }

  onContactTeacher(teacherId: string | undefined): void {
    this.childService.contactTeacher(teacherId);
  }
}
