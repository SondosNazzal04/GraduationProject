type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

declare global {
  interface Window {
    __env?: {
      firebase?: FirebaseWebConfig;
    };
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
