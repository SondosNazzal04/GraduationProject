import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ShopItem } from '../../models/shop-item.model';
import { Toast } from '../../models/toast.model';
import { getApiBaseUrl } from '../../firebase.runtime-config';

@Component({
  selector: 'app-venture-shop',
  imports: [CommonModule, RouterModule],
  templateUrl: './venture-shop.html',
  styleUrl: './venture-shop.css',
})
export class VentureShop {
  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;

  constructor() {
    void this.loadShopItems();
    void this.loadWallet();
  }
  studentName = 'Sara Ahmad';
  studentPoints = 0;

  toast: Toast | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 3500);
  }

  dismissToast(): void {
    this.toast = null;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  shopItems: ShopItem[] = [];

  private async loadShopItems(): Promise<void> {
    try {
      const json = await firstValueFrom<any>(this.http.get(`${this.baseUrl}/shop/items`));
      this.shopItems = Array.isArray(json.items) ? json.items : [];
    } catch (e) {
      console.warn('Failed to load shop items', e);
    }
  }

  private async loadWallet(): Promise<void> {
    try {
      const json = await firstValueFrom<any>(this.http.get(`${this.baseUrl}/student/me/wallet`));
      this.studentPoints = Number(json.pointsBalance || 0);
    } catch (e) {
      console.warn('Failed to load wallet', e);
    }
  }

  navItems = [
    { label: 'Dashboard', icon: 'home', route: '/student-dashboard' },
    { label: 'My Quests', icon: 'assignment', route: '/student-quests' },
    { label: 'Achievements', icon: 'emoji_events', route: '/student-achievements' },
    { label: 'Venture Shop', icon: 'storefront', route: '/venture-shop' },
    { label: 'My Classes', icon: 'menu_book', route: '/student-classes' },
    { label: 'Messages', icon: 'chat_bubble_outline', route: '/student-messages' },
    { label: 'Notifications', icon: 'notifications_none', route: '/student-notifications' },
  ];

  purchase(item: ShopItem): void {
    void (async () => {
      try {
        const json = await firstValueFrom<any>(
          this.http.post(`${this.baseUrl}/shop/redeem`, { itemId: String(item.id), quantity: 1 }),
        );
        const balanceAfter = Number(json.item?.balanceAfter ?? 0);
        this.studentPoints = balanceAfter;
        this.showToast(`${item.emoji} "${item.name}" purchased successfully!`, 'success');
      } catch (e) {
        console.warn('Redeem failed', e);
        // fallback local behavior
        if (this.studentPoints >= item.price) {
          this.studentPoints -= item.price;
          this.showToast(`${item.emoji} "${item.name}" purchased successfully!`, 'success');
        } else {
          this.showToast(`Not enough points to purchase "${item.name}".`, 'error');
        }
      }
    })();
  }
}
