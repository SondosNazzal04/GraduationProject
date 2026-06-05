type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

type RuntimeConfig = {
  firebase?: FirebaseWebConfig;
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    __env?: RuntimeConfig;
  }
}

const fallbackFirebaseConfig: FirebaseWebConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'demo-project',
  appId: 'demo-app-id'
};

export function getFirebaseConfig(): FirebaseWebConfig {
  const cfg = window.__env?.firebase;

  if (!cfg) {
    console.warn('Missing Firebase runtime config. Using a local fallback so the app can render. Add a real src/assets/env.js or public/env.js for Firebase login to work.');
    return fallbackFirebaseConfig;
  }

  return cfg;
}

export function getApiBaseUrl(): string {
  const apiBaseUrl = window.__env?.apiBaseUrl;

  if (!apiBaseUrl) {
    console.warn('Missing API base URL runtime config. Falling back to http://localhost:3000. Add apiBaseUrl to public/env.js for deployment.');
    return 'http://localhost:3000';
  }

  return apiBaseUrl.replace(/\/$/, '');
}
