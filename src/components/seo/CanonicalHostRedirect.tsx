import { useLayoutEffect } from "react";
import { publicHostRedirectUrl } from "@/lib/public-registration-redirect";

/**
 * Filet de sécurité si le script index.html n'a pas tourné (preview, tests).
 * Redirige alias (stages-langues / apex) et plateforme.fli.fr/register vers www.fli.fr.
 */
export function CanonicalHostRedirect() {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const target = publicHostRedirectUrl(window.location);
    if (target && target !== window.location.href) {
      window.location.replace(target);
    }
  }, []);

  return null;
}
