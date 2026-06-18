// import { FormsModule } from '@angular/forms';
// import { Component, inject } from '@angular/core';
// import { ChangeDetectorRef } from '@angular/core';
// import { AuthService } from '../../../shared/services/auth/auth';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-login',
//   imports: [FormsModule],
//   templateUrl: './login.html',
//   styleUrl: './login.scss',
// })

// export class Login {
//   email = '';
//   password = '';
//   errorMessage = '';
//   rememberMe = false;
//   submitted = false;

//   private authService = inject(AuthService);
//   private cdr = inject(ChangeDetectorRef);
//   private router = inject(Router);

//   async onSubmit() {
//     this.errorMessage = '';
//     try {
//       // Call the service
//       const userCredential = await this.authService.login(this.email, this.password);
//       const mustChange = await this.authService.getRequirePasswordChange(userCredential.user.uid);

//       console.log("Logged in successfully!", userCredential.user);

//       // Keep login focused on authentication. Create-user API calls should be done
//       // from an admin screen using AuthService.createUserAsAdmin(email, role).

//       if (mustChange) {
//         await this.router.navigate(['/change-password']);
//         return;
//       }

//       this.submitted = true;
//       await this.router.navigate(['/parent-dashboard']);
//     }
//     catch (error: any) {
//       this.errorMessage = error.message;
//       this.submitted = false;
//       console.error("Login failed:", error);
//     }
//     finally {
//       this.cdr.detectChanges();
//     }
//   }
// }

import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../shared/services/auth/auth';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
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
      // Step 1: Authenticate the user
      const userCredential = await this.authService.login(this.email, this.password);
      const mustChange = await this.authService.getRequirePasswordChange(userCredential.user.uid);

      console.log("Logged in successfully!", userCredential.user);

      // Step 2: Redirect to change-password if required
      if (mustChange) {
        await this.router.navigate(['/change-password']);
        return;
      }

      // Step 3: Fetch role from Firestore and route accordingly
      const role = await this.authService.getCurrentUserRole();
      console.log("User role:", role);

      switch (role) {
        case 'student':
          await this.router.navigate(['/student-dashboard']);
          break;

        case 'teacher':
          await this.router.navigate(['/teacher-dashboard']);
          break;

        case 'admin':
          await this.router.navigate(['/admin-dashboard']);
          break;

        case 'parent':
          await this.router.navigate(['/parent-dashboard']);
          break;

        default:
          this.errorMessage = 'No role assigned to your account. Please contact the administrator.';
          await this.authService.logout();
          return;
      }

      this.submitted = true;
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
