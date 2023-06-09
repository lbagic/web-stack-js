/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Sintezis
  readonly VITE_ADMIN_PANEL: string;
  readonly VITE_SNT_GRPC_URL: string;
  readonly VITE_SNT_REST_URL: string;
  readonly VITE_SNT_HASH: string;

  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  // Google maps
  readonly VITE_GOOGLE_MAPS_API_KEY: string;

  // LinkedIn
  readonly VITE_LINKEDIN_CLIENT_ID: string;
  readonly VITE_LINKEDIN_CLIENT_SECRET: string;
  readonly VITE_LINKEDIN_CALLBACK_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
