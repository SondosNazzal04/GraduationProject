import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <div class="header-bar">
        <span class="breadcrumb">Desktop · Primary</span>
      </div>
    </div>
  `,
  styles: [`
    .header {
      background: #f3f4f6;
    }
    .header-bar {
      padding: 10px 24px;
      font-size: 12px;
      color: #6b7280;
      border-bottom: none;
    }
  `]
})
export class HeaderComponent {}
