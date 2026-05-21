import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { HeaderComponent } from "./components/header/header.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <div class="main-area">
        <app-header></app-header>
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .app-shell {
        display: flex;
        height: 100vh;
        background: #e5e7eb;
        padding: 12px;
        gap: 10px;
      }
      .main-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #f3f4f6;
        border-radius: 12px;
        overflow: hidden;
        min-width: 0;
      }
      .page-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }
    `,
  ],
})
export class AppComponent {}
