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

export function getFirebaseConfig(): FirebaseWebConfig {
  const cfg = window.__env?.firebase;
  if (!cfg) {
    throw new Error('Missing Firebase runtime config. Create src/assets/env.js');
  }
  return cfg;
}
