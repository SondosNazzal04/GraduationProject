import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShopItem } from '../../models/shop-item.model';
import { Toast } from '../../models/toast.model';

@Component({
  selector: 'app-venture-shop',
  imports: [CommonModule, RouterModule],
  templateUrl: './venture-shop.html',
  styleUrl: './venture-shop.css',
})
export class VentureShop {
  private baseUrl = 'http://localhost:3000/api';

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
      const resp = await fetch(`${this.baseUrl}/shop/items`);
      if (resp.ok) {
        const json = await resp.json();
        this.shopItems = Array.isArray(json.items) ? json.items : [];
      }
    } catch (e) {
      console.warn('Failed to load shop items', e);
    }
  }

  private async loadWallet(): Promise<void> {
    try {
      const resp = await fetch(`${this.baseUrl}/student/me/wallet`);
      if (resp.ok) {
        const json = await resp.json();
        this.studentPoints = Number(json.pointsBalance || 0);
      }
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
        const resp = await fetch(`${this.baseUrl}/shop/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: String(item.id), quantity: 1 }),
        });
        if (resp.ok) {
          const json = await resp.json();
          const balanceAfter = Number(json.item?.balanceAfter ?? json.item?.balanceAfter ?? 0);
          this.studentPoints = balanceAfter;
          this.showToast(`${item.emoji} "${item.name}" purchased successfully!`, 'success');
          return;
        }
        const err = await resp.json().catch(() => ({}));
        this.showToast(err.error || 'Purchase failed', 'error');
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
