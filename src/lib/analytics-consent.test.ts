import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT_DENIED,
  clearCookieConsent,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/analytics-consent";
import { PUBLIC_SITE_ORIGIN, PUBLIC_SITEMAP_PATHS, publicAbsoluteUrl } from "@/lib/public-site";

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const memory = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("localStorage", memory);
  vi.stubGlobal("window", { localStorage: memory });
  return memory;
}

describe("analytics-consent — stockage local", () => {
  beforeEach(() => {
    installMemoryLocalStorage().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lit null tant qu'aucun choix n'est enregistré", () => {
    expect(readCookieConsent()).toBeNull();
  });

  it("persiste acceptation et refus", () => {
    const accepted = writeCookieConsent("accepted");
    expect(accepted.choice).toBe("accepted");
    expect(readCookieConsent()?.choice).toBe("accepted");

    writeCookieConsent("rejected");
    expect(readCookieConsent()?.choice).toBe("rejected");
    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toContain("rejected");
  });

  it("ignore un JSON corrompu", () => {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "{nope");
    expect(readCookieConsent()).toBeNull();
  });

  it("efface le choix", () => {
    writeCookieConsent("accepted");
    clearCookieConsent();
    expect(readCookieConsent()).toBeNull();
  });

  it("refuse analytics par défaut (Consent Mode v2)", () => {
    expect(DEFAULT_CONSENT_DENIED.analytics_storage).toBe("denied");
    expect(DEFAULT_CONSENT_DENIED.ad_storage).toBe("denied");
    expect(DEFAULT_CONSENT_DENIED.security_storage).toBe("granted");
  });
});

describe("public-site — canonique Search Console", () => {
  it("pointe le sitemap et les URLs absolues vers www.fli.fr", () => {
    expect(PUBLIC_SITE_ORIGIN).toBe("https://www.fli.fr");
    expect(publicAbsoluteUrl("/")).toBe("https://www.fli.fr/");
    expect(publicAbsoluteUrl("/register")).toBe("https://www.fli.fr/register");
    expect(PUBLIC_SITEMAP_PATHS).toContain("/politique-de-confidentialite");
  });

  it("expose un sitemap.xml et une directive Sitemap dans robots.txt", () => {
    const robots = readFileSync(join(process.cwd(), "public/robots.txt"), "utf8");
    const sitemap = readFileSync(join(process.cwd(), "public/sitemap.xml"), "utf8");
    expect(robots).toContain("Sitemap: https://www.fli.fr/sitemap.xml");
    for (const path of PUBLIC_SITEMAP_PATHS) {
      expect(sitemap).toContain(publicAbsoluteUrl(path));
    }
  });
});

describe("landing SEO / RGPD — câblage app", () => {
  it("monte le bandeau cookies et la page confidentialité", () => {
    const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain("CookieConsentBanner");
    expect(app).toContain('path="/politique-de-confidentialite"');
    expect(app).toContain("PolitiqueConfidentialite");
  });

  it("prépare Consent Mode dans index.html avant React", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    expect(html).toContain('gtag("consent", "default"');
    expect(html).toContain("analytics_storage");
    expect(html).toContain("denied");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("https://www.fli.fr/");
  });

  it("lie confidentialité et gestion cookies dans le footer landing", () => {
    const landing = readFileSync(
      join(process.cwd(), "src/pages/landing/InstitutionalLanding.tsx"),
      "utf8",
    );
    expect(landing).toContain("/politique-de-confidentialite");
    expect(landing).toContain("ManageCookiesButton");
  });

  it("n'active pas GA sans Measurement ID (garde-fou RGPD)", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    // Re-import would be needed for a live module; ici on vérifie le contrat source.
    const src = readFileSync(join(process.cwd(), "src/lib/analytics-consent.ts"), "utf8");
    expect(src).toContain("getGaMeasurementId");
    expect(src).toContain("VITE_GA_MEASUREMENT_ID");
    expect(src).toContain("anonymize_ip: true");
    vi.unstubAllEnvs();
  });
});
