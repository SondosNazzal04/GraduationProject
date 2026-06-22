import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService, Message } from '../services/chat/chat.service';
import { StudentSidebarComponent } from '../student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../student-topbar/student-topbar.component';
import { StudentPortalService } from '../../services/student-portal.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../admin-topbar/admin-topbar.component';
import { ParentSidebarComponent } from '../parent-sidebar/parent-sidebar.component';
import { AuthService } from '../services/auth/auth';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';

function waitForCurrentUser(auth: Auth): Promise<any> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

interface Contact {
  uid: string;
  email?: string;
  name: string;
  role: 'teacher' | 'admin' | 'student';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatarInitials: string;
}

// Message interface is now imported from ChatService

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StudentSidebarComponent, StudentTopbarComponent, SidebarComponent, TopbarComponent, AdminSidebarComponent, AdminTopbarComponent, ParentSidebarComponent],
  templateUrl: './direct-messages.html',
  styleUrl: './direct-messages.scss',
})
export class DirectMessages implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  ps = inject(StudentPortalService);

  contacts: Contact[] = [];
  messages: Message[] = [];
  selectedContact: Contact | null = null;
  newMessage = '';
  loadingContacts = true;
  loadingMessages = false;
  sending = false;
  searchQuery = '';
  private shouldScrollToBottom = false;
  private messagesSub?: Subscription;
  private routeSub?: Subscription;
  private contactChatsSubs: Subscription[] = [];
  contactsError = '';
  sendError = '';

  role: 'student' | 'teacher' | 'admin' | 'parent' = 'student';
  teacherName = '';
  parentName = '';

  get filteredContacts(): Contact[] {
    let list = this.contacts;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }

    // Deduplicate contacts with the same email or name, keeping the one with the most recent lastMessageTime
    const uniqueMap = new Map<string, Contact>();
    list.forEach(c => {
      const emailKey = c.email || c.name;
      const existing = uniqueMap.get(emailKey);
      if (!existing) {
        uniqueMap.set(emailKey, c);
      } else {
        const existingTime = existing.lastMessageTime ? new Date(existing.lastMessageTime).getTime() : 0;
        const newTime = c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0;
        if (newTime > existingTime) {
          uniqueMap.set(emailKey, c);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }

  get totalUnread(): number {
    return this.contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }

  async ngOnInit(): Promise<void> {
    await waitForCurrentUser(this.auth);

    try {
      const userRole = await this.authService.getCurrentUserRole();
      this.role = (userRole as any) || 'student';
      if (this.role === 'teacher') {
        const profile = await this.authService.getTeacherProfile();
        if (profile) {
          const firstName = profile.firstName || '';
          const lastName = profile.lastName || '';
          if (firstName || lastName) {
            this.teacherName = `${firstName} ${lastName}`.trim();
          } else if (profile.email) {
            this.teacherName = profile.email.split('@')[0];
          }
        }
      } else if (this.role === 'parent') {
        const profile = await this.authService.getParentProfile();
        if (profile) {
          const firstName = profile.firstName || '';
          const lastName = profile.lastName || '';
          if (firstName || lastName) {
            this.parentName = `${firstName} ${lastName}`.trim();
          } else if (profile.email) {
            this.parentName = profile.email.split('@')[0];
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load profile for chat component', err);
    }

    await this.loadContacts();

    this.listenToContactChats();

    this.routeSub = this.route.queryParams.subscribe(async (params) => {
      const contactId = params['contactId'];
      if (contactId && this.contacts.length > 0) {
        const targetContact = this.contacts.find(c => c.uid === contactId);
        if (targetContact) {
          await this.selectContact(targetContact);
          return;
        }
      }
      const displayed = this.filteredContacts;
      if (displayed.length > 0 && !this.selectedContact) {
        await this.selectContact(displayed[0]);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    this.contactChatsSubs.forEach(s => s.unsubscribe());
  }

  private listenToContactChats(): void {
    this.contactChatsSubs.forEach(s => s.unsubscribe());
    this.contactChatsSubs = [];

    const currentUserId = this.chatService.currentUserId || 'me';

    this.contacts.forEach(contact => {
      const chatId = this.chatService.getChatId(currentUserId, contact.uid);
      const sub = this.chatService.getChat(chatId).subscribe({
        next: (chat) => {
          if (chat) {
            contact.lastMessage = chat.lastMessage;
            contact.lastMessageTime = chat.lastMessageTime;
          } else {
            contact.lastMessage = '';
            contact.lastMessageTime = '';
          }
          this.sortContacts();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn(`Permission or other error reading chat ${chatId}:`, err);
        }
      });
      this.contactChatsSubs.push(sub);
    });
  }

  private sortContacts(): void {
    this.contacts.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  private async loadContacts(): Promise<void> {
    this.loadingContacts = true;
    try {
      const users = await this.chatService.getUsers();
      const currentUserId = this.chatService.currentUserId;

      this.contacts = users
        .filter(u => u.uid !== currentUserId)
        .map(u => {
          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown User';
          const initials = name.substring(0, 2).toUpperCase();
          return {
            uid: u.uid,
            email: u.email || '',
            name: name,
            role: u.role || 'student',
            avatarInitials: initials,
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0
          };
        });

      this.contactsError = '';
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      this.contactsError = error?.message || 'Failed to fetch contacts';
      this.contacts = [];
    } finally {
      this.loadingContacts = false;
      this.cdr.detectChanges();
    }
  }

  async selectContact(contact: Contact): Promise<void> {
    this.selectedContact = contact;
    contact.unreadCount = 0;
    this.loadingMessages = true;
    this.messages = [];

    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }

    const currentUserId = this.chatService.currentUserId || 'me';
    const chatId = this.chatService.getChatId(currentUserId, contact.uid);

    this.messagesSub = this.chatService.getMessages(chatId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loadingMessages = false;
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
        this.loadingMessages = false;
        this.cdr.detectChanges();
      }
    });
  }

  async sendMessage(): Promise<void> {
    const content = this.newMessage.trim();
    if (!content || !this.selectedContact || this.sending) return;

    this.sending = true;

    try {
      this.sendError = '';
      await this.chatService.sendMessage(this.selectedContact.uid, content);
      this.newMessage = '';
      this.shouldScrollToBottom = true;

      if (this.selectedContact) {
        this.selectedContact.lastMessage = content;
        this.selectedContact.lastMessageTime = new Date().toISOString();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      this.sendError = error?.message || 'Failed to send message. Check permissions.';
    } finally {
      this.sending = false;
      this.cdr.detectChanges();
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

  formatLastMessageTime(timestamp: string | undefined): string {
    if (!timestamp) return '';
    if (timestamp === 'Just now') return 'Just now';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isYesterday) return 'Yesterday';

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
