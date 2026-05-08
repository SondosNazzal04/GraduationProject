import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth/auth';

@Component({
  selector: 'app-change-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  submitted = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  async onSubmit() {
    this.errorMessage = '';
    this.submitted = false;

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please enter and confirm your new password.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    try {
      await this.authService.changePasswordAndClearFlag(this.newPassword);
      this.submitted = true;
      await this.router.navigate(['/parent-dashboard']);
    } catch (error: any) {
      this.errorMessage = error?.message ?? 'Unable to change password.';
    }
  }

}
