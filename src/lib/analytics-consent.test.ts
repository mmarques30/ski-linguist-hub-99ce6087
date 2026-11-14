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
import {
  PUBLIC_ALIAS_HOSTS,
  PUBLIC_CANONICAL_HOST,
  PUBLIC_SITE_ORIGIN,
  PUBLIC_SITEMAP_PATHS,
  isPublicAliasHost,
  isPublicIndexablePath,
  normalizePublicPath,
  publicAbsoluteUrl,
} from "@/lib/public-site";

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
    expect(PUBLIC_CANONICAL_HOST).toBe("www.fli.fr");
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

  it("redirige les hôtes alias (stages-langues, apex fli) vers www", () => {
    expect(PUBLIC_ALIAS_HOSTS).toContain("stages-langues.fr");
    expect(PUBLIC_ALIAS_HOSTS).toContain("www.stages-langues.fr");
    expect(PUBLIC_ALIAS_HOSTS).toContain("fli.fr");
    expect(isPublicAliasHost("www.stages-langues.fr")).toBe(true);
    expect(isPublicAliasHost("plateforme.fli.fr")).toBe(false);
    expect(isPublicAliasHost("www.fli.fr")).toBe(false);
  });

  it("ne marque indexable que les chemins du sitemap", () => {
    expect(isPublicIndexablePath("/")).toBe(true);
    expect(isPublicIndexablePath("/register/")).toBe(true);
    expect(isPublicIndexablePath("/fli-wp/")).toBe(false);
    expect(isPublicIndexablePath("/app")).toBe(false);
    expect(normalizePublicPath("/register/")).toBe("/register");
  });
});

describe("landing SEO / RGPD — câblage app", () => {
  it("monte le bandeau cookies, le head SEO et la page confidentialité", () => {
    const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain("CookieConsentBanner");
    expect(app).toContain("PublicSiteHead");
    expect(app).toContain("CanonicalHostRedirect");
    expect(app).toContain('path="/politique-de-confidentialite"');
    expect(app).toContain("PolitiqueConfidentialite");
  });

  it("prépare Consent Mode et redirections d'hôtes dans index.html", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    expect(html).toContain('gtag("consent", "default"');
    expect(html).toContain("analytics_storage");
    expect(html).toContain("denied");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("https://www.fli.fr/");
    expect(html).toContain("stages-langues.fr");
    expect(html).toContain("www.stages-langues.fr");
    expect(html).toContain('"fli.fr"');
    expect(html).not.toContain("%VITE_GOOGLE_SITE_VERIFICATION%");
  });

  it("lie confidentialité et gestion cookies dans le footer landing", () => {
    const landing = readFileSync(
      join(process.cwd(), "src/pages/landing/InstitutionalLanding.tsx"),
      "utf8",
    );
    expect(landing).toContain("/politique-de-confidentialite");
    expect(landing).toContain("ManageCookiesButton");
  });

  it("n'active pas GA sans Measurement ID et suit les pages SPA", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    const src = readFileSync(join(process.cwd(), "src/lib/analytics-consent.ts"), "utf8");
    expect(src).toContain("getGaMeasurementId");
    expect(src).toContain("VITE_GA_MEASUREMENT_ID");
    expect(src).toContain("anonymize_ip: true");
    expect(src).toContain("send_page_view: false");
    expect(src).toContain("trackSpaPageView");
    expect(src).toContain("syncGoogleSiteVerificationMeta");
    vi.unstubAllEnvs();
  });

  it("expose PublicSiteHead pour canonical / robots / page_view", () => {
    const head = readFileSync(
      join(process.cwd(), "src/components/seo/PublicSiteHead.tsx"),
      "utf8",
    );
    expect(head).toContain("trackSpaPageView");
    expect(head).toContain("isPublicIndexablePath");
    expect(head).toContain("noindex,nofollow");
    expect(head).toContain("syncGoogleSiteVerificationMeta");
  });
});
