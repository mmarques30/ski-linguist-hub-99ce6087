import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEGACY_PUBLIC_REGISTRATION_HOST,
  PUBLIC_REGISTRATION_URL,
  legacyRegistrationRedirectUrl,
} from "./public-registration-redirect";

describe("redirection publique /register", () => {
  it("envoie plateforme.fli.fr/register vers www.fli.fr en conservant la requête", () => {
    expect(
      legacyRegistrationRedirectUrl({
        hostname: "plateforme.fli.fr",
        pathname: "/register",
        search: "?lang=english",
        hash: "#formation",
      }),
    ).toBe("https://www.fli.fr/register?lang=english#formation");
    expect(
      legacyRegistrationRedirectUrl({
        hostname: "PLATEFORME.FLI.FR",
        pathname: "/register/",
        search: "",
        hash: "",
      }),
    ).toBe(PUBLIC_REGISTRATION_URL);
  });

  it("laisse le formulaire sur www, l'apex, Lovable et le dev local", () => {
    for (const hostname of ["www.fli.fr", "fli.fr", "ski-linguist-hub.lovable.app", "localhost"]) {
      expect(
        legacyRegistrationRedirectUrl({
          hostname,
          pathname: "/register",
          search: "",
          hash: "",
        }),
      ).toBeNull();
    }
  });

  it("ne redirige pas les retours de paiement", () => {
    for (const pathname of ["/register/payment-success", "/register/payment-cancel"]) {
      expect(
        legacyRegistrationRedirectUrl({
          hostname: LEGACY_PUBLIC_REGISTRATION_HOST,
          pathname,
          search: "?code=FLI-1",
          hash: "",
        }),
      ).toBeNull();
    }
  });

  it("garde le script de index.html d'accord avec le module", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    expect(html).toContain(`location.hostname !== "${LEGACY_PUBLIC_REGISTRATION_HOST}"`);
    expect(html).toContain(`location.replace("${PUBLIC_REGISTRATION_URL}"`);
    expect(html).toContain('path !== "/register"');
  });
});
