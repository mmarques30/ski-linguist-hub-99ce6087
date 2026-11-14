/**
 * Google Analytics 4 + Consent Mode v2 (RGPD / CNIL).
 *
 * - Consentement refusé par défaut (avant tout chargement de balise).
 * - GA ne reçoit `analytics_storage: granted` qu'après acceptation explicite.
 * - Sans `VITE_GA_MEASUREMENT_ID`, aucune balise Google n'est chargée.
 */

import { publicAbsoluteUrl } from "@/lib/public-site";

export const COOKIE_CONSENT_STORAGE_KEY = "fli-cookie-consent-v1";

export type CookieConsentChoice = "accepted" | "rejected";

export interface CookieConsentState {
  choice: CookieConsentChoice;
  updatedAt: string;
}

type GtagCommand = "consent" | "js" | "config" | "event" | "set";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DENIED = "denied" as const;
const GRANTED = "granted" as const;

/** Valeurs Consent Mode v2 avant interaction (UE / EEE / UK). */
export const DEFAULT_CONSENT_DENIED = {
  ad_storage: DENIED,
  ad_user_data: DENIED,
  ad_personalization: DENIED,
  analytics_storage: DENIED,
  functionality_storage: DENIED,
  personalization_storage: DENIED,
  security_storage: GRANTED,
  wait_for_update: 500,
} as const;

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed.choice !== "accepted" && parsed.choice !== "rejected") return null;
    if (typeof parsed.updatedAt !== "string" || !parsed.updatedAt) return null;
    return { choice: parsed.choice, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentState {
  const state: CookieConsentState = {
    choice,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

export function clearCookieConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
}

export function getGaMeasurementId(): string | undefined {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  return id || undefined;
}

export function getGoogleSiteVerification(): string | undefined {
  const token = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
  return token || undefined;
}

function ensureGtagStub(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
}

/** À appeler une fois au démarrage, avant tout chargement gtag.js. */
export function initConsentDefaults(): void {
  ensureGtagStub();
  window.gtag!("consent", "default", { ...DEFAULT_CONSENT_DENIED });
}

export function applyConsentChoice(choice: CookieConsentChoice): void {
  ensureGtagStub();
  const analytics = choice === "accepted" ? GRANTED : DENIED;
  window.gtag!("consent", "update", {
    ad_storage: DENIED,
    ad_user_data: DENIED,
    ad_personalization: DENIED,
    analytics_storage: analytics,
    functionality_storage: analytics,
    personalization_storage: DENIED,
    security_storage: GRANTED,
  });
}

let gaScriptRequested = false;

export function loadGoogleAnalytics(measurementId: string): void {
  if (typeof document === "undefined" || !measurementId) return;
  ensureGtagStub();

  if (!gaScriptRequested) {
    gaScriptRequested = true;
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://www.googletagmanager.com/gtag/js"]`,
    );
    if (!existing) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }
  }

  window.gtag!("js", new Date());
  window.gtag!("config", measurementId, {
    anonymize_ip: true,
    // Les vues SPA sont envoyées via `trackSpaPageView` (évite le double comptage).
    send_page_view: false,
  });
}

/**
 * Page view SPA (React Router). Sans Measurement ID ou sans gtag, no-op.
 */
export function trackSpaPageView(pathname: string, search = ""): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId || typeof window === "undefined") return;
  ensureGtagStub();
  if (typeof window.gtag !== "function") return;

  const path = `${pathname}${search}`;
  window.gtag!("event", "page_view", {
    page_path: path,
    page_location: `${publicAbsoluteUrl(pathname)}${search}`,
    page_title: typeof document !== "undefined" ? document.title : undefined,
    send_to: measurementId,
  });
}

/**
 * Injecte / retire la meta Search Console (méthode balise HTML) selon l'env.
 * La propriété domaine `fli.fr` est déjà vérifiée en DNS — cette meta n'est
 * utile que pour une propriété préfixe URL.
 */
export function syncGoogleSiteVerificationMeta(): void {
  if (typeof document === "undefined") return;
  const token = getGoogleSiteVerification();
  const existing = document.querySelector<HTMLMetaElement>(
    'meta[name="google-site-verification"]',
  );

  if (!token) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.content = token;
    return;
  }

  const meta = document.createElement("meta");
  meta.name = "google-site-verification";
  meta.content = token;
  document.head.appendChild(meta);
}

/**
 * Applique un choix déjà stocké (ou les défauts), puis charge GA si un
 * Measurement ID est configuré (Consent Mode : balise OK même en denied).
 */
export function syncAnalyticsWithConsent(choice: CookieConsentChoice | null): void {
  if (choice) {
    applyConsentChoice(choice);
  } else {
    initConsentDefaults();
  }

  const measurementId = getGaMeasurementId();
  if (!measurementId) return;

  // Consent Mode v2 : on charge la balise même en « denied » (pings sans cookie).
  // Les cookies analytics ne sont posés qu'après `analytics_storage: granted`.
  loadGoogleAnalytics(measurementId);
}

export function saveAndApplyConsent(choice: CookieConsentChoice): CookieConsentState {
  const state = writeCookieConsent(choice);
  syncAnalyticsWithConsent(choice);
  return state;
}

/** Réouverture du bandeau (« Gérer les cookies »). */
export function reopenCookiePreferences(): void {
  clearCookieConsent();
  applyConsentChoice("rejected");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("fli:cookie-consent-reopen"));
  }
}

export type { GtagCommand };
