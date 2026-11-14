import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  syncGoogleSiteVerificationMeta,
  trackSpaPageView,
} from "@/lib/analytics-consent";
import {
  isPublicIndexablePath,
  normalizePublicPath,
  publicAbsoluteUrl,
} from "@/lib/public-site";

function upsertLinkRel(rel: string, href: string): void {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  // setAttribute évite toute résolution relative côté navigateur.
  el.setAttribute("href", href);
}

function upsertMetaName(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertMetaProperty(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * SEO + Analytics pour la SPA :
 * - canonical / og:url / robots selon la route (pages publiques indexables)
 * - noindex sur 404 et back-office (corrige Soft 404 / doublons Search Console)
 * - page_view GA4 à chaque navigation
 */
export function PublicSiteHead() {
  const location = useLocation();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    syncGoogleSiteVerificationMeta();
  }, []);

  useLayoutEffect(() => {
    const path = normalizePublicPath(location.pathname);
    const indexable = isPublicIndexablePath(path);
    const absolute = publicAbsoluteUrl(path);

    upsertLinkRel("canonical", absolute);
    upsertMetaProperty("og:url", absolute);
    upsertMetaName("robots", indexable ? "index,follow" : "noindex,nofollow");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const path = normalizePublicPath(location.pathname);
    const trackKey = `${path}${location.search}`;
    if (lastTracked.current === trackKey) return;
    lastTracked.current = trackKey;
    trackSpaPageView(path, location.search);
  }, [location.pathname, location.search]);

  return null;
}
