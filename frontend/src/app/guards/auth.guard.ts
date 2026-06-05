import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';

/**
 * Waits for Firebase Auth to settle its initial auth state.
 * On a fresh page load `auth.currentUser` is `null` until the SDK
 * restores the persisted session.  This helper listens for the first
 * `onAuthStateChanged` emission so the guard doesn't incorrectly
 * treat an authenticated user as unauthenticated.
 */
function waitForCurrentUser(auth: Auth): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Functional route guard that blocks unauthenticated users.
 *
 * Usage in `app.routes.ts`:
 * ```ts
 * { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 * ```
 */
export const authGuard: CanActivateFn = async (_route, _state) => {
  const auth   = inject(Auth);
  const router = inject(Router);

  // If the SDK hasn't settled yet, wait for the first auth-state emission
  const user = auth.currentUser ?? await waitForCurrentUser(auth);

  if (user) {
    return true;
  }

  // Not authenticated → redirect to login
  return router.createUrlTree(['/login']);
};
