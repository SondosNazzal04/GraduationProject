import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

interface AdminUser {
  uid: string;
  email: string | null;
  role: UserRole;
  pointsBalance?: number;
  classIds?: string[];
}

interface SchoolClass {
  id: string;
  name: string;
  code?: string;
  gradeLevel?: string;
  description?: string;
  teacherUid?: string | null;
  studentUids?: string[];
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsersComponent implements OnInit {
  private baseUrl = 'http://localhost:3000/api';

  users: AdminUser[] = [];
  classes: SchoolClass[] = [];
  loading = false;
  message = '';
  error = '';

  createUserForm = {
    email: '',
    role: 'student' as UserRole,
    classIds: [] as string[],
  };

  createClassForm = {
    name: '',
    code: '',
    gradeLevel: '',
    description: '',
    teacherUid: '',
    studentUidsText: '',
  };

  userClassDrafts: Record<string, string[]> = {};

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin-dashboard' },
    { label: 'Users', icon: 'person', route: '/admin-users' },
    { label: 'VentureShop', icon: 'storefront', route: '/admin-venture-shop' },
    { label: 'Messages', icon: 'chat_bubble_outline', route: '/admin-messages' },
    { label: 'Notifications', icon: 'notifications_none', route: '/admin-notifications' },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private parseList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [usersResp, classesResp] = await Promise.all([
        fetch(`${this.baseUrl}/admin/users`),
        fetch(`${this.baseUrl}/admin/classes`),
      ]);

      if (usersResp.ok) {
        const usersJson = await usersResp.json();
        this.users = Array.isArray(usersJson.items) ? usersJson.items : [];
        for (const user of this.users) {
          if (!this.userClassDrafts[user.uid]) {
            this.userClassDrafts[user.uid] = [...(user.classIds || [])];
          }
        }
      }

      if (classesResp.ok) {
        const classesJson = await classesResp.json();
        this.classes = Array.isArray(classesJson.items) ? classesJson.items : [];
      }
    } catch (err) {
      this.error = 'Failed to load admin data.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async createUser(): Promise<void> {
    if (!this.createUserForm.email.trim()) {
      this.error = 'Email is required.';
      return;
    }

    try {
      const resp = await fetch(`${this.baseUrl}/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.createUserForm.email.trim(),
          role: this.createUserForm.role,
          classIds: this.createUserForm.classIds,
        }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        this.error = payload.error || 'Failed to create user.';
        return;
      }

      this.message = 'User created successfully.';
      this.createUserForm = { email: '', role: 'student', classIds: [] };
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to create user.';
      console.error(err);
    }
  }

  async createClass(): Promise<void> {
    if (!this.createClassForm.name.trim()) {
      this.error = 'Class name is required.';
      return;
    }

    try {
      const resp = await fetch(`${this.baseUrl}/admin/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.createClassForm.name.trim(),
          code: this.createClassForm.code.trim(),
          gradeLevel: this.createClassForm.gradeLevel.trim(),
          description: this.createClassForm.description.trim(),
          teacherUid: this.createClassForm.teacherUid.trim() || null,
          studentUids: this.parseList(this.createClassForm.studentUidsText),
        }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        this.error = payload.error || 'Failed to create class.';
        return;
      }

      this.message = 'Class created successfully.';
      this.createClassForm = {
        name: '',
        code: '',
        gradeLevel: '',
        description: '',
        teacherUid: '',
        studentUidsText: '',
      };
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to create class.';
      console.error(err);
    }
  }

  async saveUserClasses(user: AdminUser): Promise<void> {
    try {
      const resp = await fetch(`${this.baseUrl}/admin/users/${encodeURIComponent(user.uid)}/classes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classIds: this.userClassDrafts[user.uid] || [] }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        this.error = payload.error || 'Failed to update classes.';
        return;
      }

      this.message = `Updated classes for ${user.email || user.uid}.`;
      await this.loadData();
    } catch (err) {
      this.error = 'Failed to update classes.';
      console.error(err);
    }
  }

  className(classId: string): string {
    return this.classes.find((item) => item.id === classId)?.name || classId;
  }

  studentCount(classItem: SchoolClass): number {
    return classItem.studentUids?.length || 0;
  }

  teacherLabel(teacherUid?: string | null): string {
    if (!teacherUid) {
      return 'Unassigned';
    }

    return this.users.find((user) => user.uid === teacherUid)?.email || teacherUid;
  }
}
