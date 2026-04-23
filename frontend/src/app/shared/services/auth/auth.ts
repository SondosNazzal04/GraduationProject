
import { Auth, signInWithEmailAndPassword, signOut, updatePassword } from '@angular/fire/auth';
import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})


export class AuthService{
  private firestore = inject(Firestore);
  private auth = inject(Auth);

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
      throw new Error('No authinticated user.');

    await updatePassword(user, newPassword);

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await updateDoc(userRef, {requirePasswordChange : false});
  }

  async login(email: string, password:string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }
  logout() {
    signOut(this.auth);
  }
}
