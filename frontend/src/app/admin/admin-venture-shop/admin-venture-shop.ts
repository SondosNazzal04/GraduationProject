import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject, ChangeDetectorRef } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { ShopItem } from '../../models/shop-item.model';
import { getApiBaseUrl } from '../../firebase.runtime-config';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../../shared/admin-topbar/admin-topbar.component';

/** Milliseconds before an API call is considered timed out */
const REQUEST_TIMEOUT = 10_000;

import { Notifications } from '../../shared/components/notifications/notifications';

@Component({
  selector: 'app-admin-venture-shop',
  imports: [CommonModule, RouterModule, FormsModule, Notifications, AdminSidebarComponent, AdminTopbarComponent],
  templateUrl: './admin-venture-shop.html',
  styleUrl: './admin-venture-shop.scss',
})
export class AdminVentureShop {
  private http = inject(HttpClient);
  private baseUrl = `${getApiBaseUrl()}/api`;
  private cdr = inject(ChangeDetectorRef);

  showAddModal = false;
  showEditModal = false;
  showRemoveConfirm = false;
  isLoading = false;
  isSaving = false;

  itemToRemove: ShopItem | null = null;
  itemToEdit: ShopItem | null = null;

  newItem: Partial<ShopItem> = {};
  editItem: Partial<ShopItem> = {};

  availableEmojis = [
    '🎁', '✏️', '💻', '🍕', '📚', '🏆', '🎨', '🎵', '🎮', '🧸',
    '👟', '🎫', '🍿', '🍪', '🥤', '🍩', '🍫', '⚽', '🏀', '🚗',
    '🛹', '⏰', '🔑', '🎖️', '⭐', '🎈', '🎉', '🔥', '💡', '✨',
    '🍎', '🧩', '🚀', '🎸', '📝', '📎', '🎒', '🖌️', '🍦', '🍩'
  ];

  showEmojiPickerNew = false;
  showEmojiPickerEdit = false;

  selectEmojiNew(em: string): void {
    this.newItem.emoji = em;
    this.showEmojiPickerNew = false;
  }

  selectEmojiEdit(em: string): void {
    this.editItem.emoji = em;
    this.showEmojiPickerEdit = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.emoji-picker-container')) {
      this.showEmojiPickerNew = false;
      this.showEmojiPickerEdit = false;
    }
  }

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
  async loadShopItems(): Promise<void> {
  this.isLoading = true;
  
  try {
    // Fetch items from the backend
    const json = await firstValueFrom<any>(
      this.http.get(`${this.baseUrl}/shop/items`)
    );
    this.shopItems = Array.isArray(json.items) ? json.items : [];
  } catch (error) {
    console.error('Failed to load shop items:', error);
    // Optional: Add a toast or alert here to notify the student 
    // e.g., this.showToast('Could not load shop items', 'error');
  } finally {
    // THIS IS THE MISSING PIECE: It stops the spinner even if the request crashes
    this.isLoading = false; 
    this.cdr.detectChanges();
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
    this.showEmojiPickerNew = false;
  }

  confirmAdd(): void {
    if (!this.newItem.name || this.newItem.price == null) return;
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
      this.cdr.detectChanges();
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
    this.showEmojiPickerEdit = false;
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
      this.cdr.detectChanges();
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
    void this.deleteItemOnServer();
  }

  private async deleteItemOnServer(): Promise<void> {
    if (!this.itemToRemove) return;

    const removedItem = this.itemToRemove;
    this.isSaving = true;
    
    try {
      // Hard delete: permanently remove the item via the new DELETE endpoint
      await firstValueFrom<any>(
        this.http.delete(`${this.baseUrl}/shop/items/${removedItem.id}`).pipe(timeout(REQUEST_TIMEOUT)),
      );

      // Remove from the local UI array
      this.shopItems = this.shopItems.filter((i) => i.id !== removedItem.id);
      this.showToast(`"${removedItem.name}" permanently removed from the shop.`, 'success');
      this.closeRemoveConfirm();
      
    } catch (e: any) {
      console.error('Failed to remove shop item', e);
      const msg = e?.name === 'TimeoutError' 
        ? 'Server not responding. Is the backend running?' 
        : (e?.error?.error || 'Failed to remove item. Please try again.');
      this.showToast(msg, 'error');
      this.closeRemoveConfirm();
      
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}

