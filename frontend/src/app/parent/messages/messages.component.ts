import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

interface Message {
  id: number;
  from: string;
  initials: string;
  role: string;
  preview: string;
  timeAgo: string;
  unread: boolean;
  messages: { sender: string; text: string; time: string; mine: boolean }[];
}

@Component({
  selector: 'app-parent-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, ParentSidebarComponent, TopbarComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class ParentMessagesComponent {
  conversations: Message[] = [
    { id:1, from:'Mr. Khalid',  initials:'MK', role:'Math Teacher',     preview:'Rama is doing great in class!',       timeAgo:'10 min', unread:true,
      messages:[
        { sender:'Mr. Khalid', text:'Hello, I wanted to let you know that Rama is doing great in math class. Her last exam score was excellent!', time:'10:30 AM', mine:false },
        { sender:'You',        text:'Thank you for letting me know! We have been working hard at home as well.', time:'10:35 AM', mine:true },
        { sender:'Mr. Khalid', text:'It really shows. Keep it up!', time:'10:38 AM', mine:false },
      ]
    },
    { id:2, from:'Ms. Sara',    initials:'MS', role:'Homeroom Teacher',  preview:'Regarding Ali\'s attendance record.', timeAgo:'3 hrs',  unread:true,
      messages:[
        { sender:'Ms. Sara', text:"Hi! I wanted to discuss Ali's attendance. He was absent twice this week. Is everything okay?", time:'8:00 AM', mine:false },
        { sender:'You',      text:'He was sick. He is better now and will be back tomorrow.', time:'8:10 AM', mine:true },
      ]
    },
    { id:3, from:'Mr. Bashar',  initials:'MB', role:'History Teacher',   preview:'Assignment deadline extended.',        timeAgo:'Yesterday', unread:false,
      messages:[
        { sender:'Mr. Bashar', text:'Just a quick note — the history project deadline has been extended to next Sunday.', time:'Yesterday', mine:false },
      ]
    },
  ];

  selectedConversation: Message | null = this.conversations[0];
  newMessage = '';

  selectConversation(c: Message): void {
    this.selectedConversation = c;
    c.unread = false;
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    this.selectedConversation.messages.push({
      sender: 'You', text: this.newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      mine: true
    });
    this.newMessage = '';
  }

  get unreadCount(): number { return this.conversations.filter(c => c.unread).length; }
}
