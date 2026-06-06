import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../firebase.runtime-config';
import { AuthService } from '../services/auth/auth';

interface Contact {
  uid: string;
  name: string;
  role: 'teacher' | 'admin' | 'student';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatarInitials: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './direct-messages.html',
  styleUrl: './direct-messages.css',
})
export class DirectMessages implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${getApiBaseUrl()}/api`;

  navItems = [
    { label: 'Dashboard',  icon: 'dashboard',           route: '/student-dashboard' },
    { label: 'Activities', icon: 'assignment',          route: '/studentactivities' },
    { label: 'My Classes', icon: 'class',               route: '/my-classes' },
    { label: 'Attendance', icon: 'event_available',     route: '/attendance' },
    { label: 'Grades',     icon: 'grade',               route: '/gradebook' },
    { label: 'Shop',       icon: 'storefront',          route: '/venture-shop' },
    { label: 'Messages',   icon: 'chat_bubble_outline', route: '/student-messages' },
  ];

  contacts: Contact[] = [];
  messages: Message[] = [];
  selectedContact: Contact | null = null;
  newMessage = '';
  loadingContacts = true;
  loadingMessages = false;
  sending = false;
  searchQuery = '';
  private shouldScrollToBottom = false;
  private pollInterval: any = null;

  private mockContacts: Contact[] = [
    { uid: 'teacher-1', name: 'Mr. Khalid Hassan', role: 'teacher', avatarInitials: 'KH', lastMessage: 'Great work on your assignment!', lastMessageTime: '10:30 AM', unreadCount: 2 },
    { uid: 'teacher-2', name: 'Ms. Lara Nasser',   role: 'teacher', avatarInitials: 'LN', lastMessage: "Don't forget the quiz tomorrow.", lastMessageTime: 'Yesterday', unreadCount: 0 },
    { uid: 'teacher-3', name: 'Dr. Omar Saleh',    role: 'teacher', avatarInitials: 'OS', lastMessage: 'Office hours at 2PM today.', lastMessageTime: 'Mon', unreadCount: 1 },
  ];

  private mockMessages: Record<string, Message[]> = {
    'teacher-1': [
      { id: '1', senderId: 'teacher-1', receiverId: 'me', content: 'Hi! I reviewed your last assignment.', timestamp: '2025-01-10T09:00:00Z', isOwn: false },
      { id: '2', senderId: 'me', receiverId: 'teacher-1', content: 'Thank you Mr. Khalid! I worked really hard on it.', timestamp: '2025-01-10T09:05:00Z', isOwn: true },
      { id: '3', senderId: 'teacher-1', receiverId: 'me', content: 'Great work! You scored 95/100.', timestamp: '2025-01-10T10:30:00Z', isOwn: false },
    ],
    'teacher-2': [
      { id: '4', senderId: 'teacher-2', receiverId: 'me', content: "Don't forget the quiz tomorrow covers chapters 3–5.", timestamp: '2025-01-09T14:00:00Z', isOwn: false },
      { id: '5', senderId: 'me', receiverId: 'teacher-2', content: 'Got it, thank you Ms. Lara!', timestamp: '2025-01-09T14:10:00Z', isOwn: true },
    ],
    'teacher-3': [
      { id: '6', senderId: 'teacher-3', receiverId: 'me', content: 'Office hours at 2PM today if anyone needs help.', timestamp: '2025-01-08T10:00:00Z', isOwn: false },
    ],
  };

  get filteredContacts(): Contact[] {
    if (!this.searchQuery.trim()) return this.contacts;
    const q = this.searchQuery.toLowerCase();
    return this.contacts.filter(c => c.name.toLowerCase().includes(q));
  }

  get totalUnread(): number {
    return this.contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }

  async ngOnInit(): Promise<void> {
    await this.loadContacts();
    if (this.contacts.length > 0) await this.selectContact(this.contacts[0]);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private async loadContacts(): Promise<void> {
    this.loadingContacts = true;
    try {
      // TODO: replace with real API
      // const json = await firstValueFrom<any>(this.http.get(`${this.baseUrl}/student/me/contacts`));
      // this.contacts = json.items ?? [];
      await this.delay(400);
      this.contacts = this.mockContacts;
    } catch {
      this.contacts = this.mockContacts;
    } finally {
      this.loadingContacts = false;
    }
  }

  async selectContact(contact: Contact): Promise<void> {
    this.selectedContact = contact;
    contact.unreadCount = 0;
    this.loadingMessages = true;
    this.messages = [];
    if (this.pollInterval) clearInterval(this.pollInterval);
    try {
      // TODO: replace with real API
      // const json = await firstValueFrom<any>(this.http.get(`${this.baseUrl}/messages/${contact.uid}`));
      // this.messages = json.items ?? [];
      await this.delay(300);
      this.messages = (this.mockMessages[contact.uid] || []).map(m => ({ ...m }));
      this.shouldScrollToBottom = true;
    } catch {
      this.messages = this.mockMessages[contact.uid] || [];
    } finally {
      this.loadingMessages = false;
    }
    this.pollInterval = setInterval(() => this.pollMessages(), 5000);
  }

  private async pollMessages(): Promise<void> {
    if (!this.selectedContact) return;
    // TODO: replace with real API or WebSocket
  }

  async sendMessage(): Promise<void> {
    const content = this.newMessage.trim();
    if (!content || !this.selectedContact || this.sending) return;

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: 'me',
      receiverId: this.selectedContact.uid,
      content,
      timestamp: new Date().toISOString(),
      isOwn: true,
    };

    this.messages.push(tempMsg);
    this.newMessage = '';
    this.shouldScrollToBottom = true;
    this.sending = true;

    if (this.selectedContact) {
      this.selectedContact.lastMessage = content;
      this.selectedContact.lastMessageTime = 'Just now';
    }

    try {
      // TODO: replace with real API
      // await firstValueFrom(this.http.post(`${this.baseUrl}/messages`, { receiverId: this.selectedContact.uid, content }));
      await this.delay(300);
    } catch {
      tempMsg.id = `failed-${tempMsg.id}`;
    } finally {
      this.sending = false;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.sendMessage();
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    const diff = today.getDate() - date.getDate();
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const curr = new Date(this.messages[index].timestamp).toDateString();
    const prev = new Date(this.messages[index - 1].timestamp).toDateString();
    return curr !== prev;
  }

  private scrollToBottom(): void {
    try { this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' }); } catch { }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}