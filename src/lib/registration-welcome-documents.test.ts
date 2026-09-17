import { describe, expect, it } from "vitest";
import {
  REGISTRATION_TEMPLATE_STORAGE_PREFIX,
  REGISTRATION_WELCOME_DOCUMENTS,
  isKnownRegistrationTemplate,
  registrationTemplateStoragePath,
} from "./registration-welcome-documents";

describe("registration welcome document templates", () => {
  it("expose les quatre modèles d'inscription", () => {
    expect(REGISTRATION_WELCOME_DOCUMENTS).toHaveLength(4);
    expect(REGISTRATION_WELCOME_DOCUMENTS.map((d) => d.documentType)).toEqual([
      "REGLEMENT",
      "CONVENTION",
      "PROGRAMME",
      "LIVRET",
    ]);
    expect(
      REGISTRATION_WELCOME_DOCUMENTS.some((d) => d.internalFile === "tutoriel-fif-pl-fli.pdf"),
    ).toBe(true);
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
