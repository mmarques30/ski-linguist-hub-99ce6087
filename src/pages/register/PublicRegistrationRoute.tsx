import Register from "./Index";
import { legacyRegistrationRedirectUrl } from "@/lib/public-registration-redirect";

/**
 * Sur plateforme.fli.fr, /register part vers www.fli.fr avant d'afficher
 * l'ancien formulaire. Les autres hôtes (www, localhost, lovable.app)
 * gardent le formulaire.
 */
export default function PublicRegistrationRoute() {
  if (typeof window !== "undefined") {
    const target = legacyRegistrationRedirectUrl(window.location);
    if (target) {
      window.location.replace(target);
      return null;
    }
  }
  return <Register />;
}
