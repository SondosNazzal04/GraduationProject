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
  studentName = 'Sara Ahmad';
  studentPoints = 5200;

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

  shopItems: ShopItem[] = [
    {
      id: 1,
      name: 'Mini Notebook',
      description: 'Wear casual clothes for one day instead of uniform',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=250&fit=crop',
      emoji: '📒',
    },
    {
      id: 2,
      name: 'Badges',
      description: 'Extra Badge Slot',
      price: 4000,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=250&fit=crop',
      emoji: '🏅',
    },
    {
      id: 3,
      name: 'New Avatar',
      description: 'Change your profile picture',
      price: 1120,
      image: '',
      emoji: '🖼️',
    },
    {
      id: 4,
      name: 'Pen',
      description: 'Get a real pen from the school',
      price: 500,
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=250&fit=crop',
      emoji: '✏️',
    },
    {
      id: 5,
      name: 'Cafeteria Voucher',
      description: 'Wear casual clothes for one day instead of uniform',
      price: 950,
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop',
      emoji: '☕',
    },
    {
      id: 6,
      name: 'Title next to Name',
      description: 'Top Achiever: Recognizes high performance.',
      price: 6950,
      image: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&h=250&fit=crop',
      emoji: '🤩',
    },
  ];

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
    if (this.studentPoints >= item.price) {
      this.studentPoints -= item.price;
      this.showToast(`${item.emoji} "${item.name}" purchased successfully!`, 'success');
    } else {
      this.showToast(`Not enough points to purchase "${item.name}".`, 'error');
    }
  }
}
