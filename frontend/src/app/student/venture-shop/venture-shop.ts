import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, collection, query, where, orderBy, onSnapshot } from '@angular/fire/firestore';
import { firstValueFrom, timeout } from 'rxjs';
import { ShopItem } from '../../models/shop-item.model';
import { Toast } from '../../models/toast.model';
import { getApiBaseUrl } from '../../firebase.runtime-config';

import { Notifications } from '../../shared/components/notifications/notifications';

@Component({
  selector: 'app-venture-shop',
  imports: [CommonModule, RouterModule, Notifications],
  templateUrl: './venture-shop.html',
  styleUrl: './venture-shop.css',
})
export class VentureShop implements OnInit {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private baseUrl = `${getApiBaseUrl()}/api`;
  private cdr = inject(ChangeDetectorRef);


  // constructor() {
  //   this.listenToShopItems();
  //   void this.loadWallet();
  // }

  ngOnInit(): void {
    // Fire off your background tasks here instead
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
  isLoading = true;

  async loadShopItems(): Promise<void> {
    this.isLoading = true;
    try {
      const json = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/shop/items`)
      );
      this.shopItems = Array.isArray(json.items) ? json.items : [];
    } catch (error) {
      console.error('Failed to load shop items:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadWallet(): Promise<void> {
    try {
      const json = await firstValueFrom<any>(
        this.http.get(`${this.baseUrl}/student/me/wallet`).pipe(timeout(10_000)),
      );
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
          this.http.post(`${this.baseUrl}/shop/redeem`, { itemId: String(item.id), quantity: 1 }).pipe(timeout(10_000)),
        );
        const balanceAfter = Number(json.item?.balanceAfter ?? 0);
        this.studentPoints = balanceAfter;
        this.showToast(`${item.emoji} "${item.name}" purchased successfully!`, 'success');
      } catch (e: any) {
        console.warn('Redeem failed', e);
        if (e?.error?.error === 'Not enough points') {
          this.showToast(`Not enough points to purchase "${item.name}".`, 'error');
        } else if (this.studentPoints >= item.price) {
          this.studentPoints -= item.price;
          this.showToast(`${item.emoji} "${item.name}" purchased successfully!`, 'success');
        } else {
          this.showToast(`Not enough points to purchase "${item.name}".`, 'error');
        }
      }
    })();
  }


}
