/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Built-in environment variables
   * @see https://vitejs.dev/guide/env-and-mode.html#env-files
   */
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  
  /** Add other environment variables here */
  // readonly VITE_API_URL: string;
  // readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  /**
   * Contains application environment data.
   */
  readonly env: ImportMetaEnv;
}

// This tells TypeScript that this file is a module
// and not a script file
export {};
