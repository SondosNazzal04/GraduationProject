import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow" *ngIf="eyebrow">{{ eyebrow }}</p>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="page-subtitle" *ngIf="pageSubtitle">{{ pageSubtitle }}</p>
      </div>
      <div class="topbar-actions">
        <!-- Add actions here if needed -->
      </div>
    </header>
  `,
  styles: [`
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: #ffffff; border-bottom: 1px solid #e8eaed; }
    .page-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .eyebrow { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
    .page-subtitle { font-size: 13px; color: #555; margin: 4px 0 0; }
    .topbar-actions { display: flex; align-items: center; gap: 12px; }
  `]
})
export class AdminTopbarComponent {
  @Input() pageTitle = 'Dashboard';
  @Input() eyebrow = '';
  @Input() pageSubtitle = '';
}
