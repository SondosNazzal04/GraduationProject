import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParentSidebarComponent } from '../../shared/parent-sidebar/parent-sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

interface Notification {
  id: number;
  type: 'grade' | 'attendance' | 'badge' | 'message' | 'assignment';
  title: string;
  body: string;
  timeAgo: string;
  childName: string;
  read: boolean;
}

@Component({
  selector: 'app-parent-notifications',
  standalone: true,
  imports: [CommonModule, ParentSidebarComponent, TopbarComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class ParentNotificationsComponent {
  notifications: Notification[] = [
    { id:1, type:'grade',      title:'New Grade Posted',           body:"Rama received 95% on the Math Midterm Exam.",               timeAgo:'2 hours ago',  childName:'Rama Omar',  read:false },
    { id:2, type:'badge',      title:'Achievement Unlocked!',      body:"Ali earned the 'Perfect Week' badge for 100% attendance.",   timeAgo:'5 hours ago',  childName:'Ali Omar',   read:false },
    { id:3, type:'attendance', title:'Attendance Alert',            body:"Rama was marked absent in Science class today.",             timeAgo:'Yesterday',    childName:'Rama Omar',  read:true  },
    { id:4, type:'assignment', title:'Assignment Submitted',        body:"Ali submitted the English Essay assignment.",                timeAgo:'Yesterday',    childName:'Ali Omar',   read:true  },
    { id:5, type:'message',    title:'New Message from Teacher',    body:"Mr. Khalid sent you a message about Rama's progress.",      timeAgo:'2 days ago',   childName:'Rama Omar',  read:true  },
    { id:6, type:'grade',      title:'Grade Updated',               body:"Ali received 88% on the Physics Unit Exam.",                timeAgo:'3 days ago',   childName:'Ali Omar',   read:true  },
  ];

  get unreadCount(): number { return this.notifications.filter(n => !n.read).length; }

  markRead(n: Notification): void { n.read = true; }
  markAllRead(): void { this.notifications.forEach(n => n.read = true); }

  getTypeColor(type: string): string {
    const map: Record<string,string> = {
      grade:'#1565C0', attendance:'#ef4444', badge:'#9333ea',
      message:'#22c55e', assignment:'#f59e0b'
    };
    return map[type] ?? '#888';
  }

  getTypeBg(type: string): string {
    const map: Record<string,string> = {
      grade:'#e3f2fd', attendance:'#fee2e2', badge:'#f3e8ff',
      message:'#dcfce7', assignment:'#fef3c7'
    };
    return map[type] ?? '#f0f0f0';
  }
}
