import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getApiBaseUrl } from '../firebase.runtime-config';

function waitForCurrentUser(auth: Auth): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function getFirebaseToken(auth: Auth): Promise<string | null> {
  const user = auth.currentUser ?? (await waitForCurrentUser(auth));

  if (!user) {
    return null;
  }

  return await user.getIdToken();
}

function shouldAttachToken(url: string): boolean {
  const apiBaseUrl = getApiBaseUrl();
  return url.startsWith('/api') || url.startsWith(apiBaseUrl);
}

export const firebaseAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!shouldAttachToken(req.url)) {
    return next(req);
  }

  const auth = inject(Auth);

  return from(getFirebaseToken(auth)).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }

      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
