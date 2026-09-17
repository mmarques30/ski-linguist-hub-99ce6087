import { describe, expect, it } from "vitest";
import {
  REGISTRATION_TEMPLATE_STORAGE_PREFIX,
  REGISTRATION_WELCOME_DOCUMENTS,
  isKnownRegistrationTemplate,
  registrationTemplateStoragePath,
} from "./registration-welcome-documents";

describe("registration welcome document templates", () => {
  it("expose les trois modèles d'inscription", () => {
    expect(REGISTRATION_WELCOME_DOCUMENTS).toHaveLength(3);
    expect(REGISTRATION_WELCOME_DOCUMENTS.map((d) => d.documentType)).toEqual([
      "REGLEMENT",
      "CONVENTION",
      "PROGRAMME",
    ]);
  });

  it("construit un chemin storage staff stable", () => {
    expect(
      registrationTemplateStoragePath("criteres-prise-en-charge-2026.pdf"),
    ).toBe(`${REGISTRATION_TEMPLATE_STORAGE_PREFIX}/criteres-prise-en-charge-2026.pdf`);
    expect(isKnownRegistrationTemplate("contenu-pedagogique-station-2022.dotx")).toBe(
      true,
    );
    expect(isKnownRegistrationTemplate("../etc/passwd")).toBe(false);
    expect(() => registrationTemplateStoragePath("../x.pdf")).toThrow();
  });
});
