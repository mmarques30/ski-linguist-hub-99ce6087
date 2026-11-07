import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  buildAgeficeFormationTitle,
  fillAgeficeDemandePdf,
  formatAgeficeDateFr,
  isIndividualModalityForAgefice,
  isOnlineModalityForAgefice,
} from "./agefice-demande-pdf";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

const TEMPLATE = readFileSync(
  join(
    process.cwd(),
    "public/registration-documents/agefice-demande-prise-en-charge-2025-2026.pdf",
  ),
);

describe("agefice-demande-pdf", () => {
  it("formate les dates AGEFICE en JJ/MM/AAAA", () => {
    expect(formatAgeficeDateFr("2026-11-16")).toBe("16/11/2026");
    expect(formatAgeficeDateFr(null)).toBe("");
  });

  it("détecte visioconférence vs présentiel / individuel", () => {
    expect(isOnlineModalityForAgefice("en_ligne_groupe")).toBe(true);
    expect(isOnlineModalityForAgefice("presentiel")).toBe(false);
    expect(isIndividualModalityForAgefice("en_ligne_individuel")).toBe(true);
    expect(isIndividualModalityForAgefice("en_ligne_groupe")).toBe(false);
  });

  it("construit l'intitulé de formation moniteur", () => {
    expect(buildAgeficeFormationTitle("Portugais brésilien")).toContain(
      "portugais brésilien",
    );
  });

  it("préremplit le PDF éditable (Clément Dubois — cas type visio)", async () => {
    const bytes = await fillAgeficeDemandePdf({
      templatePdfBytes: new Uint8Array(TEMPLATE),
      student: {
        first_name: "Clément",
        last_name: "Dubois",
        email: "clemdub74@gmail.com",
        phone: "0666138927",
        street_address: "985 route des bois venants",
        postal_code: "74110",
        city: "Morzine",
        company: "ESF Avoriaz",
      },
      inscription: {
        code: "FLI-260146",
        language: "Portugais brésilien",
        course_location: "En ligne",
        start_date: "2026-11-16",
        end_date: "2026-12-09",
        price: 900,
        duration_hours: 24,
        modality: "en_ligne_groupe",
        formateur: "Flavia Lana Faria",
      },
      signatureDateIso: "2026-11-07",
    });

    expect(bytes.byteLength).toBeGreaterThan(10_000);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();
    expect(form.getTextField("Nom (Stagiaire)").getText()).toBe("Dubois");
    expect(form.getTextField("Prénom  (Stagiaire)").getText()).toBe("Clément");
    expect(form.getTextField("Adresse Email  (Stagiaire)").getText()).toBe(
      "clemdub74@gmail.com",
    );
    expect(form.getTextField("Raison Sociale ( OF)").getText()).toContain(
      "France Langues",
    );
    expect(form.getTextField("Date de Début (Formation)").getText()).toBe(
      "16/11/2026",
    );
    expect(form.getTextField("Prix Ht (Formation)").getText()).toBe("900");
    expect(form.getTextField("Durée ( FOAD Synchrone - Formation)").getText()).toBe(
      "24",
    );
    expect(form.getTextField("Nom du formateur").getText()).toBe(
      "Flavia Lana Faria",
    );
    // Toujours éditable
    expect(form.getFields().length).toBeGreaterThan(20);
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const front = source("src/lib/agefice-demande-pdf.ts");
    const deno = source("supabase/functions/_shared/agefice-demande-pdf.ts");
    const stripImport = (texte: string) =>
      texte.replace(/^import .+$/m, "IMPORT");
    expect(stripImport(deno)).toBe(stripImport(front));
    expect(deno).toContain('https://esm.sh/pdf-lib@1.17.1');
    expect(front).toContain('from "pdf-lib"');
  });
});
