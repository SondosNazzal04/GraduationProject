import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { ShopItem } from '../../models/shop-item.model';
import { getApiBaseUrl } from '../../firebase.runtime-config';

/** Milliseconds before an API call is considered timed out */
const REQUEST_TIMEOUT = 10_000;

@Component({
  selector: 'app-admin-venture-shop',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-venture-shop.html',
  styleUrl: './admin-venture-shop.css',
})
export class AdminVentureShop {
  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;

  showAddModal = false;
  showEditModal = false;
  showRemoveConfirm = false;
  isLoading = false;
  isSaving = false;

  itemToRemove: ShopItem | null = null;
  itemToEdit: ShopItem | null = null;

  newItem: Partial<ShopItem> = {};
  editItem: Partial<ShopItem> = {};

  toast: { message: string; type: 'success' | 'error' } | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin-dashboard' },
    { label: 'Users', icon: 'person', route: '/admin-users' },
    { label: 'VentureShop', icon: 'storefront', route: '/admin-venture-shop' },
    { label: 'Messages', icon: 'chat_bubble_outline', route: '/admin-messages' },
    { label: 'Notifications', icon: 'notifications_none', route: '/admin-notifications' },
  ];

  shopItems: ShopItem[] = [];

  constructor() {
    void this.loadShopItems();
  }

  // ── Toast ─────────────────────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 3500);
  }

  dismissToast(): void {
    this.toast = null;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Load Items from API ───────────────────────────────────────────
  private async loadShopItems(): Promise<void> {
    this.isLoading = true;
    try {
      const json = await firstValueFrom<any>(this.http.get(`${this.baseUrl}/shop/items`).pipe(timeout(REQUEST_TIMEOUT)));
      this.shopItems = Array.isArray(json.items) ? json.items : [];
    } catch (e: any) {
      console.error('Failed to load shop items', e);
      const msg = e?.name === 'TimeoutError' ? 'Server not responding. Is the backend running?' : 'Failed to load shop items from server.';
      this.showToast(msg, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // ── Add Item ──────────────────────────────────────────────────────
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
    void this.createItemOnServer();
  }

  private async createItemOnServer(): Promise<void> {
    this.isSaving = true;
    try {
      const json = await firstValueFrom<any>(
        this.http.post(`${this.baseUrl}/shop/items`, {
          name: this.newItem.name,
          description: this.newItem.description ?? '',
          price: this.newItem.price,
          image: this.newItem.image ?? '',
          emoji: this.newItem.emoji ?? '🎁',
        }).pipe(timeout(REQUEST_TIMEOUT)),
      );

      // Add the newly created item (with its server-assigned id) to the local list
      if (json.item) {
        this.shopItems = [json.item, ...this.shopItems];
      }

      this.showToast(`"${this.newItem.name}" added to the shop!`, 'success');
      this.closeAddModal();
    } catch (e: any) {
      console.error('Failed to create shop item', e);
      const msg = e?.name === 'TimeoutError' ? 'Server not responding. Is the backend running?' : (e?.error?.error || 'Failed to add item. Please try again.');
      this.showToast(msg, 'error');
    } finally {
      this.isSaving = false;
    }
  }

  // ── Edit Item ─────────────────────────────────────────────────────
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
    void this.updateItemOnServer();
  }

  private async updateItemOnServer(): Promise<void> {
    if (!this.itemToEdit) return;

    this.isSaving = true;
    try {
      const json = await firstValueFrom<any>(
        this.http.put(`${this.baseUrl}/shop/items/${this.itemToEdit.id}`, {
          name: this.editItem.name,
          description: this.editItem.description ?? '',
          price: this.editItem.price,
          image: this.editItem.image ?? '',
          emoji: this.editItem.emoji ?? '🎁',
        }).pipe(timeout(REQUEST_TIMEOUT)),
      );

      // Update the local list with server response
      if (json.item) {
        this.shopItems = this.shopItems.map((i) =>
          i.id === json.item.id ? json.item : i,
        );
      } else {
        // fallback: apply edit locally
        this.shopItems = this.shopItems.map((i) =>
          i.id === this.itemToEdit!.id ? { ...i, ...this.editItem, id: i.id } : i,
        );
      }

      this.showToast(`"${this.editItem.name}" updated successfully!`, 'success');
      this.closeEditModal();
    } catch (e: any) {
      console.error('Failed to update shop item', e);
      const msg = e?.name === 'TimeoutError' ? 'Server not responding. Is the backend running?' : (e?.error?.error || 'Failed to update item. Please try again.');
      this.showToast(msg, 'error');
    } finally {
      this.isSaving = false;
    }
  }

  // ── Remove Item ───────────────────────────────────────────────────
  openRemoveConfirm(item: ShopItem): void {
    this.itemToRemove = item;
    this.showRemoveConfirm = true;
  }

  closeRemoveConfirm(): void {
    this.showRemoveConfirm = false;
    this.itemToRemove = null;
  }

  confirmRemove(): void {
    if (!this.itemToRemove) return;
    void this.deactivateItemOnServer();
  }

  private async deactivateItemOnServer(): Promise<void> {
    if (!this.itemToRemove) return;

    const removedItem = this.itemToRemove;
    this.isSaving = true;
    try {
      // Soft-delete: set active = false so the item disappears from the student shop
      await firstValueFrom<any>(
        this.http.put(`${this.baseUrl}/shop/items/${removedItem.id}`, {
          active: false,
        }).pipe(timeout(REQUEST_TIMEOUT)),
      );

      this.shopItems = this.shopItems.filter((i) => i.id !== removedItem.id);
      this.showToast(`"${removedItem.name}" removed from the shop.`, 'success');
      this.closeRemoveConfirm();
    } catch (e: any) {
      console.error('Failed to remove shop item', e);
      const msg = e?.name === 'TimeoutError' ? 'Server not responding. Is the backend running?' : (e?.error?.error || 'Failed to remove item. Please try again.');
      this.showToast(msg, 'error');
      this.closeRemoveConfirm();
    } finally {
      this.isSaving = false;
    }
  }
}
