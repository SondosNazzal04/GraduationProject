import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../firebase.runtime-config';
import { AuthService } from '../../shared/services/auth/auth';

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
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${getApiBaseUrl()}/api`;

  users: AdminUser[] = [];
  classes: SchoolClass[] = [];
  loading = false;
  submitting = false;
  message = '';
  error = '';
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

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
      const [usersJson, classesJson] = await Promise.all([
        firstValueFrom<any>(this.http.get(`${this.baseUrl}/admin/users`)),
        firstValueFrom<any>(this.http.get(`${this.baseUrl}/admin/classes`)),
      ]);

      this.users = Array.isArray(usersJson.items) ? usersJson.items : [];
      for (const user of this.users) {
        if (!this.userClassDrafts[user.uid]) {
          this.userClassDrafts[user.uid] = [...(user.classIds || [])];
        }
      }

      this.classes = Array.isArray(classesJson.items) ? classesJson.items : [];
    } catch (err) {
      this.error = 'Failed to load admin data.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async createUser(): Promise<void> {
    this.clearMessages();

    const email = this.createUserForm.email.trim();
    if (!email) {
      this.error = 'Email is required.';
      return;
    }

    this.submitting = true;
    try {
      const result: any = await this.authService.createUserAsAdmin(
        email,
        this.createUserForm.role,
        this.createUserForm.classIds,
      );

      const tempPassword = result?.temporaryPassword ?? '';
      const emailStatus = result?.emailStatus ?? '';

      let successMsg = `User "${email}" created as ${this.createUserForm.role}.`;
      if (tempPassword) {
        successMsg += ` Temp password: ${tempPassword}`;
      }
      if (emailStatus === 'sent') {
        successMsg += ' — welcome email sent.';
      } else if (emailStatus === 'failed') {
        successMsg += ' — ⚠ welcome email could not be sent.';
      }

      this.showSuccess(successMsg);
      this.createUserForm = { email: '', role: 'student', classIds: [] };
      await this.loadData();
    } catch (err) {
      this.error = this.parseFirebaseError(err);
      console.error('createUser error:', err);
    } finally {
      this.submitting = false;
    }
  }

  private clearMessages(): void {
    this.message = '';
    this.error = '';
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
  }

  private showSuccess(msg: string): void {
    this.message = msg;
    this.error = '';
    this.messageTimer = setTimeout(() => {
      this.message = '';
    }, 6000);
  }

  /**
   * Extracts a human-readable message from Firebase/backend errors.
   * The backend at POST /api/admin/create-user returns { error: "..." }
   * where the message is typically a Firebase Auth error string.
   */
  private parseFirebaseError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const serverMsg: string = err.error?.error || err.error?.message || '';

      // Map well-known Firebase Auth error codes to friendly text
      if (serverMsg.includes('email-already-exists') || serverMsg.includes('email already exists')) {
        return 'This email address is already registered. Please use a different email.';
      }
      if (serverMsg.includes('invalid-email') || serverMsg.includes('badly formatted')) {
        return 'The email address is invalid. Please check the format (e.g. user@example.com).';
      }
      if (serverMsg.includes('invalid-password') || serverMsg.includes('at least 6 characters')) {
        return 'Firebase rejected the generated password. Please try again.';
      }
      if (serverMsg.includes('too-many-requests')) {
        return 'Too many requests. Please wait a moment and try again.';
      }
      if (serverMsg.includes('insufficient-permission') || serverMsg.includes('PERMISSION_DENIED')) {
        return 'Permission denied. The admin service account may not have the required access.';
      }

      // Return the raw server message if it's informative
      if (serverMsg) {
        return `Failed to create user: ${serverMsg}`;
      }

      // Fallback based on HTTP status
      if (err.status === 400) return 'Bad request — please check the form inputs.';
      if (err.status === 401) return 'Session expired. Please log in again.';
      if (err.status === 403) return 'You do not have permission to create users.';
      if (err.status === 0) return 'Cannot reach the server. Is the backend running?';
    }

    return 'An unexpected error occurred while creating the user.';
  }

  async createClass(): Promise<void> {
    if (!this.createClassForm.name.trim()) {
      this.error = 'Class name is required.';
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/admin/classes`, {
          name: this.createClassForm.name.trim(),
          code: this.createClassForm.code.trim(),
          gradeLevel: this.createClassForm.gradeLevel.trim(),
          description: this.createClassForm.description.trim(),
          teacherUid: this.createClassForm.teacherUid.trim() || null,
          studentUids: this.parseList(this.createClassForm.studentUidsText),
        }),
      );

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
      await firstValueFrom(
        this.http.put(`${this.baseUrl}/admin/users/${encodeURIComponent(user.uid)}/classes`, {
          classIds: this.userClassDrafts[user.uid] || [],
        }),
      );

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
