import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student-topbar.component.html',
  styleUrls: ['./student-topbar.component.scss']
})
export class StudentTopbarComponent {
  @Input() pageTitle = '';
  @Input() studentName = 'Sara Ahmad';
  @Input() level = 12;
  @Input() venturePoints = 2500;
  @Input() notifCount = 3;
  searchQuery = '';
}
