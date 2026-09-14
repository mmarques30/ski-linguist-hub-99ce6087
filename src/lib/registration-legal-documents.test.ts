import { describe, expect, it } from "vitest";
import { REGISTRATION_LEGAL_DOCUMENTS } from "./registration-legal-documents";

describe("REGISTRATION_LEGAL_DOCUMENTS", () => {
  it("pointe vers le règlement intérieur et les CG en PDF (nouvel onglet côté UI)", () => {
    expect(REGISTRATION_LEGAL_DOCUMENTS.reglementInterieur.href).toBe(
      "/registration-documents/reglement-interieur.pdf"
    );
    expect(REGISTRATION_LEGAL_DOCUMENTS.conditionsGenerales.href).toBe(
      "/registration-documents/conditions-generales.pdf"
    );
  });
});
