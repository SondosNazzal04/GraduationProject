
import { Auth, signInWithEmailAndPassword, signOut, updatePassword } from '@angular/fire/auth';
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService{
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private apiBaseUrl = 'http://localhost:3000';

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

  async createUserAsAdmin(email: string, role: string) {
    const token = await this.getIdToken();

    const response = await fetch(`${this.apiBaseUrl}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, role })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error ?? 'Failed to create user.');
    }

    return data;
  }

  logout() {
    signOut(this.auth);
  }
}
