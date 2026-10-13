import { describe, expect, it } from "vitest";
import {
  buildFafceaConventionSections,
  buildFafceaProgrammeSections,
  buildFafceaProgrammePdfModel,
  buildFafceaConventionPdfModel,
  fafceaTotalEur,
  formatEurFr,
  mahieuFafceaDossierInput,
} from "./fafcea-individual-dossier";

const IDENTITY = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  activity_number: "82 73 01 366 73",
  activity_authority: "préfet de région Auvergne-Rhône-Alpes",
  representative: "Paula Rangel-Halbwachs",
  website: "https://fli.fr",
  logo_url: "",
};

describe("fafcea-individual-dossier", () => {
  it("calcule 20 h × 60 € = 1 200 €", () => {
    expect(fafceaTotalEur({ durationHours: 20, hourlyRateEur: 60 })).toBe(1200);
    expect(formatEurFr(1200)).toMatch(/1\s?200/);
  });

  it("adapte le programme taxi + ski / clientèle russophone", () => {
    const sections = buildFafceaProgrammeSections({
      language: "Russe",
      durationHoursLabel: "20 heures",
      professionalActivities: ["chauffeur de taxi", "moniteur de ski"],
      targetClientele: "russophone",
    });
    const blob = sections.flatMap((s) => s.paragraphs).join("\n");
    expect(blob).toMatch(/taxi/i);
    expect(blob).toMatch(/moniteur de ski/i);
    expect(blob).toMatch(/russophone/i);
    expect(blob).toMatch(/Russe/);
    expect(blob).toMatch(/positionnement/i);
  });

  it("adapte la convention FAFCEA (objectifs métier + article financier)", () => {
    const sections = buildFafceaConventionSections({
      language: "Russe",
      datesLabel: "Dates à confirmer",
      durationHoursLabel: "20 heures",
      studentAddressLines: ["623 Rue De L'Aiguille Du Fruit", "73120 Courchevel"],
      pedagogicalContact: "Paula Rangel-Halbwachs",
      priceLabel: "1 200 €",
      professionalActivities: ["chauffeur de taxi", "moniteur de ski"],
      targetClientele: "russophone",
    });
    const article2 = sections.find((s) => s.title.startsWith("Article II"));
    expect(article2?.paragraphs.join(" ")).toMatch(/russophone/);
    expect(article2?.paragraphs.join(" ")).toMatch(/taxi/);
    const article6 = sections.find((s) => s.title.startsWith("Article VI"));
    expect(article6?.paragraphs.join(" ")).toMatch(/FAFCEA/);
    expect(article6?.paragraphs.join(" ")).toMatch(/Aucun frais de dossier de 150/);
  });

  it("construit les modèles PDF Mahieu", () => {
    const input = mahieuFafceaDossierInput(
      IDENTITY,
      new Date("2026-10-13T12:00:00.000Z")
    );
    const programme = buildFafceaProgrammePdfModel(input);
    const convention = buildFafceaConventionPdfModel(input);
    expect(programme.title).toMatch(/Russe/);
    expect(programme.fundingLabel).toBe("FAFCEA");
    expect(programme.studentDisplayName).toBe("Sébastien Mahieu");
    expect(programme.priceLabel).toMatch(/1\s?200/);
    expect(convention.onlineSignatureBlock).toBe(true);
    expect(convention.sections[0]?.title).toBe("Entre les soussignés");
    expect(convention.studentPhone).toBe("0784203064");
    expect(convention.studentAddressLines[0]).toMatch(/Aiguille Du Fruit/);
  });
});
