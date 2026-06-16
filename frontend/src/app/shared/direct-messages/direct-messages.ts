import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService, Message } from '../services/chat/chat.service';
import { StudentSidebarComponent } from '../student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../student-topbar/student-topbar.component';
import { StudentPortalService } from '../../services/student-portal.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../admin-topbar/admin-topbar.component';
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

// Message interface is now imported from ChatService

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StudentSidebarComponent, StudentTopbarComponent, SidebarComponent, TopbarComponent, AdminSidebarComponent, AdminTopbarComponent],
  templateUrl: './direct-messages.html',
  styleUrl: './direct-messages.css',
})
export class DirectMessages implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
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
  contactsError = '';
  sendError = '';

  role: 'student' | 'teacher' | 'admin' = 'student';
  teacherName = '';

  get filteredContacts(): Contact[] {
    if (!this.searchQuery.trim()) return this.contacts;
    const q = this.searchQuery.toLowerCase();
    return this.contacts.filter(c => c.name.toLowerCase().includes(q));
  }

  get totalUnread(): number {
    return this.contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }

  async ngOnInit(): Promise<void> {
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
      }
    } catch (err) {
      console.warn('Failed to load profile for chat component', err);
    }

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
    if (this.messagesSub) {
      this.messagesSub.unsubscribe();
    }
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
        this.selectedContact.lastMessageTime = 'Just now';
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