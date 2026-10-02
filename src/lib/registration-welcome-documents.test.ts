import { describe, expect, it } from "vitest";
import {
  AGEFICE_WELCOME_DOCUMENTS,
  LEGACY_WORD_REGISTRATION_TEMPLATES,
  REGISTRATION_TEMPLATE_STORAGE_PREFIX,
  REGISTRATION_WELCOME_DOCUMENTS,
  REPLACEABLE_REGISTRATION_TEMPLATES,
  expectsAgeficeWelcomePack,
  isKnownRegistrationTemplate,
  isReplaceableRegistrationTemplate,
  registrationTemplateStoragePath,
  resolveWelcomePackDocuments,
} from "./registration-welcome-documents";

describe("registration welcome document templates", () => {
  it("expose les quatre pièces du pack (PDF, pas Word)", () => {
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
    expect(
      REGISTRATION_WELCOME_DOCUMENTS.every(
        (d) => !d.filename.toLowerCase().endsWith(".dotx") && !d.internalFile?.endsWith(".dotx"),
      ),
    ).toBe(true);
    expect(
      REGISTRATION_WELCOME_DOCUMENTS.filter((d) => d.delivery === "generated_pdf").map(
        (d) => d.documentType,
      ),
    ).toEqual(["CONVENTION", "PROGRAMME"]);
  });

  it("expose le pack AGEFICE (demande + pièces, sans critères FIF-PL)", () => {
    expect(AGEFICE_WELCOME_DOCUMENTS.map((d) => d.documentType)).toEqual([
      "CONVENTION",
      "PROGRAMME",
      "AGEFICE_DEMANDE",
      "AGEFICE_PIECES",
    ]);
    expect(expectsAgeficeWelcomePack({ fundingOrganization: "AGEFICE" })).toBe(true);
    expect(
      resolveWelcomePackDocuments({ fundingOrganization: "AGEFICE" }),
    ).toBe(AGEFICE_WELCOME_DOCUMENTS);
    expect(
      resolveWelcomePackDocuments({
        fundingOrganization: "FIFPL",
        observations: "Moniteur de ski",
      }),
    ).toBe(REGISTRATION_WELCOME_DOCUMENTS);
  });

  it("route un pack distinct par flux financement (funding-flows)", async () => {
    const { SELF_WELCOME_DOCUMENTS } = await import("./registration-welcome-documents");
    expect(
      resolveWelcomePackDocuments({ fundingOrganization: "Autofinancement" }),
    ).toBe(SELF_WELCOME_DOCUMENTS);
    expect(SELF_WELCOME_DOCUMENTS.map((d) => d.documentType)).toEqual([
      "CONVENTION",
      "PROGRAMME",
    ]);
    expect(resolveWelcomePackDocuments({ fundingOrganization: "OPCO" })).toBeNull();
    expect(
      resolveWelcomePackDocuments({ fundingOrganization: "Entreprise" }),
    ).toBeNull();
    expect(
      resolveWelcomePackDocuments({ fundingOrganization: "FIFPL" }),
    ).toBe(REGISTRATION_WELCOME_DOCUMENTS);
  });

  it("ne permet de remplacer que les PDF statiques (pas les .dotx)", () => {
    expect(REPLACEABLE_REGISTRATION_TEMPLATES.map((d) => d.internalFile)).toEqual([
      "criteres-prise-en-charge-2026.pdf",
      "tutoriel-fif-pl-fli.pdf",
      "agefice-demande-prise-en-charge-2025-2026.pdf",
      "agefice-pieces-justificatives-2026.pdf",
    ]);
    expect(isReplaceableRegistrationTemplate("criteres-prise-en-charge-2026.pdf")).toBe(true);
    expect(
      isReplaceableRegistrationTemplate("agefice-demande-prise-en-charge-2025-2026.pdf"),
    ).toBe(true);
    expect(
      isReplaceableRegistrationTemplate("convention-stage-langues-station-2022.dotx"),
    ).toBe(false);
  });

  it("garde les anciens Word en référence legacy seulement", () => {
    expect(LEGACY_WORD_REGISTRATION_TEMPLATES).toHaveLength(2);
    expect(
      LEGACY_WORD_REGISTRATION_TEMPLATES.every((d) => d.internalFile.endsWith(".dotx")),
    ).toBe(true);
    expect(isKnownRegistrationTemplate("contenu-pedagogique-station-2022.dotx")).toBe(true);
  });

  it("construit un chemin storage staff stable", () => {
    expect(
      registrationTemplateStoragePath("criteres-prise-en-charge-2026.pdf"),
    ).toBe(`${REGISTRATION_TEMPLATE_STORAGE_PREFIX}/criteres-prise-en-charge-2026.pdf`);
    expect(isKnownRegistrationTemplate("../etc/passwd")).toBe(false);
    expect(() => registrationTemplateStoragePath("../x.pdf")).toThrow();
  });

  it("refuse tout .dotx dans le pack exposé au stagiaire / BO", () => {
    for (const doc of REGISTRATION_WELCOME_DOCUMENTS) {
      expect(doc.filename.toLowerCase().endsWith(".pdf") || doc.filename.includes("{code}")).toBe(
        true,
      );
      if (doc.delivery === "generated_pdf") {
        expect(doc.internalFile).toBeNull();
        expect(doc.label.toLowerCase()).toContain("personnalisé");
      }
    }
  });

  it("aligne les types documentType du pack Deno (commentaire de garde)", async () => {
    const { readFileSync } = await import("node:fs");
    const deno = readFileSync(
      "supabase/functions/_shared/ski-monitor-welcome-documents.ts",
      "utf8",
    );
    expect(deno).toContain('delivery: "generated_pdf"');
    expect(deno).toContain("Refus de charger un modèle Word");
    expect(deno).toContain("SKI_MONITOR_STATIC_PACK_DOCUMENTS");
    expect(deno).not.toMatch(
      /buildSkiMonitorWelcomeAttachments[\s\S]*\.dotx/,
    );
  });
});
