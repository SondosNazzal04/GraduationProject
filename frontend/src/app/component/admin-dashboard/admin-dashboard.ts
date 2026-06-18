import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { AdminSidebarComponent } from '../../shared/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../../shared/admin-topbar/admin-topbar.component';
import { getApiBaseUrl } from '../../firebase.runtime-config';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, AdminTopbarComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private baseUrl = `${getApiBaseUrl()}/api`;

  stats = {
    totalUsers: 0,
    students: 0,
    teachers: 0,
    parents: 0,
    admins: 0,
    totalClasses: 0,
    shopItems: 0
  };

  loading = true;

  async ngOnInit() {
    try {
      console.log('Starting dashboard API requests...');
      const [usersRes, classesRes, shopRes] = await Promise.all([
        firstValueFrom<any>(this.http.get(`${this.baseUrl}/admin/users`).pipe(timeout(5000))).catch(e => { console.error('Users failed', e); return { items: [] }; }),
        firstValueFrom<any>(this.http.get(`${this.baseUrl}/admin/classes`).pipe(timeout(5000))).catch(e => { console.error('Classes failed', e); return { items: [] }; }),
        firstValueFrom<any>(this.http.get(`${this.baseUrl}/shop/items`).pipe(timeout(5000))).catch(e => { console.error('Shop failed', e); return { items: [] }; })
      ]);
      console.log('API requests finished', { usersRes, classesRes, shopRes });

      const users = usersRes?.items || [];
      const classes = classesRes?.items || [];
      const shopItems = shopRes?.items || [];

      this.stats.totalUsers = users.length;
      this.stats.students = users.filter((u: any) => u.role === 'student').length;
      this.stats.teachers = users.filter((u: any) => u.role === 'teacher').length;
      this.stats.parents = users.filter((u: any) => u.role === 'parent').length;
      this.stats.admins = users.filter((u: any) => u.role === 'admin').length;
      
      this.stats.totalClasses = classes.length;
      this.stats.shopItems = shopItems.length;

    } catch (e) {
      console.error('Error loading dashboard stats:', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}

