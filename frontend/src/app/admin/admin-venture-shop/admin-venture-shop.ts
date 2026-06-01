import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShopItem } from '../../models/shop-item.model';

@Component({
  selector: 'app-admin-venture-shop',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-venture-shop.html',
  styleUrl: './admin-venture-shop.css',
})
export class AdminVentureShop {
  showAddModal = false;
  showEditModal = false;
  showRemoveConfirm = false;

  itemToRemove: ShopItem | null = null;
  itemToEdit: ShopItem | null = null;

  newItem: Partial<ShopItem> = {};
  editItem: Partial<ShopItem> = {};

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin-dashboard' },
    { label: 'Users', icon: 'person', route: '/admin-users' },
    { label: 'VentureShop', icon: 'storefront', route: '/admin-venture-shop' },
    { label: 'Messages', icon: 'chat_bubble_outline', route: '/admin-messages' },
    { label: 'Notifications', icon: 'notifications_none', route: '/admin-notifications' },
  ];

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
      description: 'Have a Discount of 10% from the cafeteria',
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

  openAddModal(): void {
    this.newItem = { emoji: '🎁', price: 0, image: '', name: '', description: '' };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newItem = {};
  }

  confirmAdd(): void {
    if (!this.newItem.name || !this.newItem.price) return;
    const nextId = this.shopItems.length
      ? Math.max(...this.shopItems.map((i) => i.id)) + 1
      : 1;
    this.shopItems = [
      ...this.shopItems,
      {
        id: nextId,
        name: this.newItem.name!,
        description: this.newItem.description ?? '',
        price: this.newItem.price!,
        image: this.newItem.image ?? '',
        emoji: this.newItem.emoji ?? '🎁',
      },
    ];
    this.closeAddModal();
  }

  openEditModal(item: ShopItem): void {
    this.itemToEdit = item;
    this.editItem = { ...item };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.itemToEdit = null;
    this.editItem = {};
  }

  confirmEdit(): void {
    if (!this.itemToEdit) return;
    this.shopItems = this.shopItems.map((i) =>
      i.id === this.itemToEdit!.id
        ? { ...i, ...this.editItem, id: i.id }
        : i
    );
    this.closeEditModal();
  }

  openRemoveConfirm(item: ShopItem): void {
    this.itemToRemove = item;
    this.showRemoveConfirm = true;
  }

  closeRemoveConfirm(): void {
    this.showRemoveConfirm = false;
    this.itemToRemove = null;
  }

  confirmRemove(): void {
    if (this.itemToRemove) {
      this.shopItems = this.shopItems.filter((i) => i.id !== this.itemToRemove!.id);
    }
    this.closeRemoveConfirm();
  }
}
