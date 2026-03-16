import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  rememberMe = false;
  submitted = false;

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
