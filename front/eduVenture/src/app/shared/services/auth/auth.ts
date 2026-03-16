
import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService{
  private auth = inject(Auth);
  async login(email: string, password:string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }
  logout() {
    signOut(this.auth);
  }
}
