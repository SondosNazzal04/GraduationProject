// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { Login } from './login';

// describe('Login', () => {
//   let component: Login;
//   let fixture: ComponentFixture<Login>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [Login]
//     })
//     .compileComponents();

//     fixture = TestBed.createComponent(Login);
//     component = fixture.componentInstance;
//     await fixture.whenStable();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required to use [(ngModel)]
import { AuthService } from '../../../../app/shared/services/auth/auth.spec';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  submitted = false;
  rememberMe: any;

  private authService = inject(AuthService);

  async onSubmit() {
    this.errorMessage = '';
    try {
      // Call the service
      const userCredential = await this.authService.login(this.email, this.password);
      this.submitted = true;
      console.log("Logged in successfully!", userCredential.user);
      // For now, we just log it. Later we will check if they need a password reset!
    } catch (error: any) {
      this.errorMessage = error.message;
      this.submitted = false;
      console.error("Login failed:", error);
    }
  }
}
