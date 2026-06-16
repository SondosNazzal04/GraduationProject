import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  @Input() pageTitle: string = '';
  @Input() userName: string = 'Mr. Smith';
  @Input() roleName: string = 'Teacher';
  @Input() showSearch: boolean = true;
  @Input() messagesRoute: string = '/teacher-messages';
  @Input() notificationsRoute: string = '/teacher-messages';
  searchQuery = '';
}
