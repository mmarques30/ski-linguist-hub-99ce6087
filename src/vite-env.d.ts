/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** GA4 Measurement ID (ex. G-XXXXXXXX). Public — pas un secret. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Token balise HTML Search Console (propriété préfixe URL). */
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
