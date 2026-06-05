import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { getFirebaseConfig } from './firebase.runtime-config';
import { firebaseAuthInterceptor } from './interceptors/firebase-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([firebaseAuthInterceptor])),
    provideFirebaseApp(() => initializeApp(getFirebaseConfig())),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
