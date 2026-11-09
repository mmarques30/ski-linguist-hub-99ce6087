import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  readCookieConsent,
  reopenCookiePreferences,
  saveAndApplyConsent,
  syncAnalyticsWithConsent,
  type CookieConsentChoice,
} from "@/lib/analytics-consent";

/**
 * Bandeau cookies RGPD — Consent Mode v2.
 * Monté une fois dans App ; réouvrable via `reopenCookiePreferences()`.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    syncAnalyticsWithConsent(existing?.choice ?? null);
    setVisible(!existing);

    const onReopen = () => setVisible(true);
    window.addEventListener("fli:cookie-consent-reopen", onReopen);
    return () => window.removeEventListener("fli:cookie-consent-reopen", onReopen);
  }, []);

  const choose = (choice: CookieConsentChoice) => {
    saveAndApplyConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="fli-cookie-title"
      aria-describedby="fli-cookie-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-[hsl(var(--fli-navy))] p-4 text-white shadow-lg sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2 text-sm leading-relaxed">
          <h2 id="fli-cookie-title" className="text-base font-semibold text-white">
            Cookies et mesure d'audience
          </h2>
          <p id="fli-cookie-desc" className="text-white/80">
            Nous utilisons des cookies nécessaires au fonctionnement du site, et — uniquement si
            vous acceptez — Google Analytics pour mesurer la fréquentation. Vous pouvez refuser
            les cookies analytiques : le site reste accessible.{" "}
            <Link
              to="/politique-de-confidentialite"
              className="underline decoration-white/40 underline-offset-2 hover:decoration-white"
            >
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => choose("rejected")}
          >
            Refuser
          </Button>
          <Button
            type="button"
            className="bg-[hsl(var(--fli-yellow))] text-[hsl(var(--fli-navy))] hover:bg-[hsl(var(--fli-yellow))]/90"
            onClick={() => choose("accepted")}
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Lien footer / page légale pour rouvrir le bandeau. */
export function ManageCookiesButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        reopenCookiePreferences();
      }}
    >
      Gérer les cookies
    </button>
  );
}
