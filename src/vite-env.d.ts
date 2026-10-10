/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_PORTFOLIO_CONFIG_FILE_ID?: string;
  readonly VITE_OWNER_EMAIL?: string;
  readonly VITE_DEFAULT_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
