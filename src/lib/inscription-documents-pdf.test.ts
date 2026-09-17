import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  buildConventionPdfModel,
  buildProgrammePdfModel,
  conventionFilename,
  programmeFilename,
} from "./inscription-documents-pdf";
import { renderInscriptionDocumentPdf } from "./inscription-documents-pdf-render";

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
  representative: "Paula Test",
  website: "https://fli.fr",
};

const STUDENT = {
  civility: "Mme",
  first_name: "Alice",
  last_name: "Martin",
  street_address: "12 rue des Neiges",
  postal_code: "73150",
  city: "Val d'Isère",
  email: "alice@example.com",
};

const INSCRIPTION = {
  code: "FLI-2026-TEST",
  language: "Anglais",
  start_date: "2026-01-12",
  end_date: "2026-01-16",
  duration_hours: 20,
  course_location: "Val d'Isère",
  modality: "presentiel",
  price: 890,
  deposit_amount: 150,
  balance_after_deposit: 740,
  group_size: 1,
  funding_organization: "OPCO / FIFPL",
};

function pdfVisibleText(bytes: Uint8Array): string {
  const latin = Buffer.from(bytes).toString("latin1");
  const chunks: string[] = [];
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(latin))) {
    const payload = Buffer.from(match[1], "latin1");
    try {
      chunks.push(inflateSync(payload).toString("latin1"));
    } catch {
      chunks.push(payload.toString("latin1"));
    }
  }
  return chunks
    .join("\n")
    .replace(/<([0-9A-Fa-f]+)>/g, (_, hex: string) =>
      Buffer.from(hex, "hex").toString("latin1")
    );
}

describe("PDF dossier inscription", () => {
  it("construit un modèle convention avec les champs MERGEFIELD", () => {
    const model = buildConventionPdfModel({
      inscription: INSCRIPTION,
      student: STUDENT,
      identity: IDENTITY,
      generatedAt: new Date("2026-09-17T10:00:00.000Z"),
    });
    expect(model.kind).toBe("convention");
    expect(model.studentDisplayName).toBe("Alice Martin");
    expect(model.language).toBe("Anglais");
    expect(model.inscriptionCode).toBe("FLI-2026-TEST");
    expect(model.priceLabel).toContain("890");
    expect(model.organization.siret).toContain("484");
  });

  it("génère des PDF convention et programme lisibles", async () => {
    const convention = buildConventionPdfModel({
      inscription: INSCRIPTION,
      student: STUDENT,
      identity: IDENTITY,
    });
    const programme = buildProgrammePdfModel({
      inscription: INSCRIPTION,
      student: STUDENT,
      identity: IDENTITY,
    });
    const conventionBytes = await renderInscriptionDocumentPdf(convention);
    const programmeBytes = await renderInscriptionDocumentPdf(programme);
    expect(conventionBytes.byteLength).toBeGreaterThan(1000);
    expect(programmeBytes.byteLength).toBeGreaterThan(800);

    const cText = pdfVisibleText(conventionBytes);
    expect(cText).toMatch(/Alice/);
    expect(cText).toMatch(/Martin/);
    expect(cText).toMatch(/FLI-2026-TEST/);
    expect(cText).toMatch(/Anglais/);

    const pText = pdfVisibleText(programmeBytes);
    expect(pText).toMatch(/Programme/);
    expect(pText).toMatch(/Objectifs|Contenu/);
  });

  it("nomme les fichiers PDF avec le code", () => {
    expect(conventionFilename("FLI-2026-TEST")).toBe("Convention-formation-FLI-2026-TEST.pdf");
    expect(programmeFilename("A/B")).toBe("Programme-formation-A_B.pdf");
  });
});
