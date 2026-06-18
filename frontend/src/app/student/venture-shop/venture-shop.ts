import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, collection, query, where, orderBy, onSnapshot } from '@angular/fire/firestore';
import { firstValueFrom, timeout } from 'rxjs';
import { ShopItem } from '../../models/shop-item.model';
import { Toast } from '../../models/toast.model';
import { getApiBaseUrl } from '../../firebase.runtime-config';
import { StudentPortalService } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-venture-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StudentSidebarComponent, StudentTopbarComponent],
  templateUrl: './venture-shop.html',
  styleUrl: './venture-shop.scss',
})
export class VentureShop implements OnInit {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);
  private baseUrl = `${getApiBaseUrl()}/api`;
  private cdr = inject(ChangeDetectorRef);
  ps = inject(StudentPortalService);

  cat = 'all';
  avail = 'all';
  cats = ['all', 'digital', 'badges', 'physical'];

  studentName = 'Sara Ahmad';
  studentPoints = 0;

  toast: Toast | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    void this.loadShopItems();
    void this.loadWallet();
  }

  get filtered() {
    return this.shopItems.filter(item => {
      const active = item.active !== false;
      const category = (item as any).category || 'digital';
      
      if (this.cat !== 'all' && category !== this.cat) return false;
      if (this.avail === 'available' && !active) return false;
      return true;
    });
  }

  isRedeemed(id: string | number): boolean {
    // Basic placeholder check
    return false;
  }

  canAfford(cost: number): boolean {
    return this.studentPoints >= cost;
  }

  showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  dismissToast(): void {
    this.toast = null;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.cdr.detectChanges();
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
    } finally {
      this.cdr.detectChanges();
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
      } finally {
        this.cdr.detectChanges();
      }
    })();
  }
}

