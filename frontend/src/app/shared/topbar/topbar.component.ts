import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  private router = inject(Router);

  @Input() pageTitle: string = '';
  @Input() userName: string = 'Mr. Smith';
  @Input() roleName?: string;
  @Input() showSearch: boolean = true;
  @Input() messagesRoute?: string;
  @Input() notificationsRoute?: string;
  
  searchQuery = '';

  ngOnInit() {
    const url = this.router.url;
    if (url.includes('parent')) {
      if (!this.roleName) this.roleName = 'Parent';
      if (!this.messagesRoute) this.messagesRoute = '/parent-messages';
      if (!this.notificationsRoute) this.notificationsRoute = '/parent-notifications';
    } else {
      if (!this.roleName) this.roleName = 'Teacher';
      if (!this.messagesRoute) this.messagesRoute = '/teacher-messages';
      if (!this.notificationsRoute) this.notificationsRoute = '/teacher-messages';
    }
  }
}
