import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEGACY_PUBLIC_REGISTRATION_HOST,
  PUBLIC_ALIAS_HOSTS,
  PUBLIC_REGISTRATION_URL,
  aliasHostRedirectUrl,
  legacyRegistrationRedirectUrl,
  publicHostRedirectUrl,
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

  it("laisse le formulaire sur www, Lovable et le dev local", () => {
    for (const hostname of ["www.fli.fr", "ski-linguist-hub.lovable.app", "localhost"]) {
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

  it("ne redirige pas les retours de paiement sur plateforme", () => {
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

  it("redirige les hôtes alias (stages-langues, apex) vers www.fli.fr", () => {
    expect(
      aliasHostRedirectUrl({
        hostname: "www.stages-langues.fr",
        pathname: "/fli-wp/",
        search: "?x=1",
        hash: "",
      }),
    ).toBe("https://www.fli.fr/fli-wp?x=1");
    expect(
      aliasHostRedirectUrl({
        hostname: "fli.fr",
        pathname: "/",
        search: "",
        hash: "#methode",
      }),
    ).toBe("https://www.fli.fr/#methode");
    expect(
      publicHostRedirectUrl({
        hostname: "stages-langues.fr",
        pathname: "/register",
        search: "",
        hash: "",
      }),
    ).toBe("https://www.fli.fr/register");
  });

  it("garde le script de index.html d'accord avec les alias et /register plateforme", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    for (const host of PUBLIC_ALIAS_HOSTS) {
      expect(html).toContain(`"${host}"`);
    }
    expect(html).toContain(`host === "${LEGACY_PUBLIC_REGISTRATION_HOST}"`);
    expect(html).toContain(`path === "/register"`);
    expect(html).toContain(`location.replace("${PUBLIC_REGISTRATION_URL}"`);
    expect(html).toContain('location.replace("https://www.fli.fr" + path + suffix)');
  });
});
