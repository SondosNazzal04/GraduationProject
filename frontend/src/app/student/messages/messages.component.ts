import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, Message } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';

@Component({ selector:'app-std-messages', standalone:true,
  imports:[CommonModule,FormsModule,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./messages.component.html', styleUrls:['./messages.component.scss'] })
export class StudentMessagesComponent implements OnInit {
  conversations = signal<Message[]>([]);
  selected      = signal<Message|null>(null);
  selectedIdx   = signal(0);
  newMsg = '';

  private palette = ['#f06292','#1565C0','#9333ea','#22c55e','#f59e0b'];

  constructor(public ps: StudentPortalService) {}

  ngOnInit() {
    this.ps.getMessages().subscribe(m => {
      this.conversations.set(m);
      if (m.length) this.selected.set(m[0]);
    });
  }

  select(m: Message, idx: number): void {
    this.selected.set(m);
    this.selectedIdx.set(idx);
    m.unread = false;
  }

  color(idx: number): string { return this.palette[idx % this.palette.length]; }

  get selectedColor(): string { return this.color(this.selectedIdx()); }

  send(): void {
    if (!this.newMsg.trim() || !this.selected()) return;
    this.selected()!.messages.push({
      sender: 'You', text: this.newMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      mine: true
    });
    this.newMsg = '';
  }
}
