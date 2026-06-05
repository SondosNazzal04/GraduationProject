import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AuthService } from '../shared/services/auth/auth';

/**
 * Waits for Firebase Auth to settle its initial auth state.
 * On a fresh page load / manual URL change `auth.currentUser` is `null`
 * until the SDK restores the persisted session.
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
 * Functional route guard that blocks users whose Firestore role
 * does not match the `roles` array declared in the route's `data`.
 *
 * This guard should always be paired with `authGuard` so that
 * authentication is verified first (fast, no Firestore call).
 *
 * Usage in `app.routes.ts`:
 * ```ts
 * {
 *   path: 'admin-dashboard',
 *   component: AdminDashboard,
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['admin'] }
 * }
 * ```
 */

/** Maps each role to its dashboard route. */
const DASHBOARD_BY_ROLE: Record<string, string> = {
  student: '/student-dashboard',
  teacher: '/teacher-dashboard',
  admin:   '/admin-dashboard',
  parent:  '/parent-dashboard',
};

export const roleGuard: CanActivateFn = async (route, _state) => {
  const auth        = inject(Auth);
  const router      = inject(Router);
  const authService = inject(AuthService);

  // Wait for Firebase to settle — auth.currentUser may still be null
  // on a fresh page load or manual URL navigation.
  const user = auth.currentUser ?? await waitForCurrentUser(auth);

  // Not logged in → send to login page
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // Read allowed roles from route data
  const allowedRoles: string[] = route.data?.['roles'] ?? [];

  if (allowedRoles.length === 0) {
    // No roles configured → allow (guard is a no-op for this route)
    return true;
  }

  const userRole = await authService.getCurrentUserRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Authenticated but wrong role → redirect to the user's own dashboard
  const dashboard = (userRole && DASHBOARD_BY_ROLE[userRole]) ?? '/login';
  return router.createUrlTree([dashboard]);
};
