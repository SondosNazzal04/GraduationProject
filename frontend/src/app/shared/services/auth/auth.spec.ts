// import { TestBed } from '@angular/core/testing';

import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService{
  private auth = inject(Auth);
  login(email: string, password:string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  logout() {
    signOut(this.auth);
  }
}

// describe('Auth', () => {
//   let service: Auth;

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//     service = TestBed.inject(Auth);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
// });
