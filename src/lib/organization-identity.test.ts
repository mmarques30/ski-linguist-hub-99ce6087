import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EMPTY_ORGANIZATION_IDENTITY,
  formatOrganizationAddress,
  buildOrganizationEmailFooterHtml,
  isOrganizationIdentityComplete,
  missingRequiredIdentityFields,
  organizationInvoiceHeader,
  organizationLegalMentions,
  ORGANIZATION_IDENTITY_FIELDS,
  ORGANIZATION_IDENTITY_KEY,
  organizationIdentityToJson,
  parseOrganizationIdentity,
} from "./organization-identity";
import { parseFliIdentity } from "./evaluation-pdf";

/**
 * BL-036 — `/settings` doit vraiment écrire l'identité de l'organisation.
 * L'écran écrivait dans le vide et annonçait « Modifications enregistrées ».
 */

const IDENTITE_LIVE = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
};

describe("identité de l'organisation", () => {
  it("écrit dans la clé déjà lue par les PDF", () => {
    expect(ORGANIZATION_IDENTITY_KEY).toBe("fli_identity");
  });

  it("relit l'identité déjà en base sans rien perdre", () => {
    const identity = parseOrganizationIdentity(IDENTITE_LIVE);
    expect(identity.legal_name).toBe("France Langues International");
    expect(identity.phone).toBe("04 79 28 21 09");
    expect(identity.siret).toBe("");
    expect(isOrganizationIdentityComplete(identity)).toBe(true);
  });

  it("reste lisible par les PDF d'évaluation après ajout des mentions", () => {
    const identity = parseOrganizationIdentity({
      ...IDENTITE_LIVE,
      siret: "484 772 041 00048",
      activity_number: "82 73 01 366 73",
    });
    const pourPdf = parseFliIdentity(identity);
    expect(pourPdf).not.toBeNull();
    expect(pourPdf?.city).toBe("Montmélian");
  });

  it("tolère une valeur absente, nulle ou incomplète", () => {
    expect(parseOrganizationIdentity(null)).toEqual(EMPTY_ORGANIZATION_IDENTITY);
    expect(parseOrganizationIdentity("texte")).toEqual(EMPTY_ORGANIZATION_IDENTITY);
    const partielle = parseOrganizationIdentity({ legal_name: "  FLI  " });
    expect(partielle.legal_name).toBe("FLI");
    expect(partielle.city).toBe("");
    expect(missingRequiredIdentityFields(partielle).map((f) => f.key)).toEqual([
      "address_line",
      "postal_code",
      "city",
    ]);
  });

  it("n'affiche aucune mention légale vide", () => {
    expect(organizationLegalMentions(EMPTY_ORGANIZATION_IDENTITY)).toEqual([]);
    expect(
      organizationLegalMentions(
        parseOrganizationIdentity({ ...IDENTITE_LIVE, siret: "484 772 041 00048" })
      )
    ).toEqual(["SIRET : 484 772 041 00048"]);
    expect(formatOrganizationAddress(parseOrganizationIdentity(IDENTITE_LIVE))).toBe(
      "25 avenue de la Gare, 73800 Montmélian"
    );
  });

  it("relit et persiste logo_url hors formulaire", () => {
    const avecLogo = parseOrganizationIdentity({
      ...IDENTITE_LIVE,
      logo_url: "  https://example.test/logo/org-logo.png  ",
    });
    expect(avecLogo.logo_url).toBe("https://example.test/logo/org-logo.png");
    expect(parseOrganizationIdentity({ legal_name: "FLI" }).logo_url).toBe("");
    expect(organizationIdentityToJson(avecLogo).logo_url).toBe(
      "https://example.test/logo/org-logo.png"
    );
  });

  it("construit un pied d'email HTML avec la raison sociale", () => {
    const html = buildOrganizationEmailFooterHtml(parseOrganizationIdentity(IDENTITE_LIVE));
    expect(html).toContain("France Langues International");
    expect(html).toContain("Cordialement,");
    expect(html).toContain("mailto:info@fli.fr");
  });

  it("repli sur les coordonnées FLI pour l'en-tête facture", () => {
    const header = organizationInvoiceHeader(EMPTY_ORGANIZATION_IDENTITY);
    expect(header.name).toBe("France Langues International");
    expect(header.address).toBe("25 avenue de la gare");
    expect(header.cityLine).toBe("73800 Montmélian");
    expect(header.phone).toBe("+33 (0)6 27 13 45 16");
    expect(header.email).toBe("contact@france-langues-international.com");
    expect(header.siret).toBe("484 772 041 00048");
    expect(header.logoUrl).toBe("");
  });

  it("couvre les mentions attendues sur une convention", () => {
    const cles = ORGANIZATION_IDENTITY_FIELDS.map((f) => f.key);
    for (const attendue of [
      "legal_name",
      "representative",
      "address_line",
      "siret",
      "activity_number",
      "activity_authority",
    ]) {
      expect(cles, attendue).toContain(attendue);
    }
  });

  it("ne laisse plus /settings simuler un enregistrement", () => {
    const page = readFileSync(join(process.cwd(), "src", "pages/Settings.tsx"), "utf8");
    expect(page).not.toContain("console.log(");
    expect(page).not.toContain("saveSuccess");
    expect(page).not.toContain("Enregistrer les modifications");
    // Plus aucun champ en dur : les saisies vivent dans des cartes qui écrivent.
    expect(page).not.toContain("<Input");
    expect(page).not.toContain("fli-langues.fr");
    expect(page).toContain("OrganizationIdentityCard");
    expect(page).toContain("TaughtLanguagesCard");
  });
});
