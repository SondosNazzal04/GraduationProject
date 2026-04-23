import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../shared/services/auth/auth';
import { Router } from '@angular/router';

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
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  async onSubmit() {
    this.errorMessage = '';
    try {
      // Call the service
      const userCredential = await this.authService.login(this.email, this.password);
      const mustChange = await this.authService.getRequirePasswordChange(userCredential.user.uid);

      console.log("Logged in successfully!", userCredential.user);

      if (mustChange) {
        await this.router.navigate(['/change-password']);
        return;
      }

      this.submitted = true;
      await this.router.navigate(['/parent-dashboard']);
    }
    catch (error: any) {
      this.errorMessage = error.message;
      this.submitted = false;
      console.error("Login failed:", error);
    }
    finally {
      this.cdr.detectChanges();
    }
  }
}
