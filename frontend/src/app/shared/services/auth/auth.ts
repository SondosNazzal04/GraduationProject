
import { Auth, signInWithEmailAndPassword, signOut, updatePassword } from '@angular/fire/auth';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { getApiBaseUrl } from '../../../firebase.runtime-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService{
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private apiBaseUrl = getApiBaseUrl();

  async getRequirePasswordChange(uid: string): Promise<boolean> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);

    if (!snap.exists())
      return false;
    return !!snap.data()[`requirePasswordChange`];
  }

  async changePasswordAndClearFlag(newPassword: string): Promise<void> {
    const user = this.auth.currentUser;

    if (!user)
      throw new Error('No authenticated user.');

    await updatePassword(user, newPassword);

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, {requirePasswordChange : false});
  }

  async login(email: string, password:string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async getIdToken(forceRefresh = false): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    return await user.getIdToken(forceRefresh);
  }

  async getCurrentUserRole(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) {
      return null;
    }

    const snap = await getDoc(doc(this.firestore, `users/${user.uid}`));
    if (!snap.exists()) {
      return null;
    }

    return (snap.data()[`role`] ?? null) as string | null;
  }

  async createUserAsAdmin(
    email: string,
    role: string,
    classIds: string[] = [],
    firstName: string = '',
    lastName: string = '',
    dateOfBirth: string = '',
    childrenUids: string[] = [],
  ): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/api/admin/create-user`, {
        email,
        role,
        classIds,
        firstName,
        lastName,
        dateOfBirth,
        childrenUids,
      }),
    );
  }

  async updateUserAsAdmin(
    uid: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      classIds?: string[];
      childrenUids?: string[];
    }
  ): Promise<any> {
    return await firstValueFrom(
      this.http.put(`${this.apiBaseUrl}/api/admin/users/${encodeURIComponent(uid)}`, data)
    );
  }

  async deleteUserAsAdmin(uid: string): Promise<any> {
    return await firstValueFrom(
      this.http.delete(`${this.apiBaseUrl}/api/admin/users/${encodeURIComponent(uid)}`)
    );
  }

  async getAdminProfile() {
    return await firstValueFrom(this.http.get(`${this.apiBaseUrl}/api/admin/me`));
  }

  async listStudents() {
    const data = await firstValueFrom<any>(this.http.get(`${this.apiBaseUrl}/api/admin/students`));
    return data.items ?? [];
  }

  async getStudentProfile() {
    return await firstValueFrom(this.http.get(`${this.apiBaseUrl}/api/student/me`));
  }

  private teacherProfileCache: any = null;
  private parentProfileCache: any = null;

  async getTeacherProfile(): Promise<any> {
    if (this.teacherProfileCache) {
      return this.teacherProfileCache;
    }
    const profile = await firstValueFrom(this.http.get(`${this.apiBaseUrl}/api/teacher/me`));
    this.teacherProfileCache = profile;
    return profile;
  }

  async getParentProfile(): Promise<any> {
    if (this.parentProfileCache) {
      return this.parentProfileCache;
    }
    const profile = await firstValueFrom(this.http.get(`${this.apiBaseUrl}/api/parent/me`));
    this.parentProfileCache = profile;
    return profile;
  }

  logout() {
    this.teacherProfileCache = null;
    this.parentProfileCache = null;
    signOut(this.auth);
  }
}
