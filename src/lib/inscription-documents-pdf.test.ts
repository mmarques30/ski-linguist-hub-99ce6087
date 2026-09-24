import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  buildConventionPdfModel,
  buildProgrammePdfModel,
  buildOnlineConventionSections,
  buildOnlineProgrammeSections,
  conventionFilename,
  isOnlineModality,
  programmeFilename,
} from "./inscription-documents-pdf";
import { renderInscriptionDocumentPdf } from "./inscription-documents-pdf-render";
import {
  FLI_DOCUMENT_FOOTER_V2_LINES,
  FLI_DOCUMENT_FOOTER_V4_LINES,
} from "./organization-identity";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  it("détecte la modalité en ligne", () => {
    expect(isOnlineModality("en_ligne_individuel")).toBe(true);
    expect(isOnlineModality("presentiel")).toBe(false);
  });

  it("construit la convention en ligne avec articles Paula + pied Version 4", async () => {
    const model = buildConventionPdfModel({
      inscription: {
        ...INSCRIPTION,
        modality: "en_ligne_individuel",
        course_location: "En ligne",
        duration_hours: 12,
      },
      student: STUDENT,
      identity: IDENTITY,
      generatedAt: new Date("2026-09-24T10:00:00.000Z"),
    });
    expect(model.sections.some((s) => s.title.startsWith("Article I"))).toBe(true);
    expect(model.sections.some((s) => s.title.includes("Réservation"))).toBe(true);
    expect(model.documentFooterLines).toEqual([...FLI_DOCUMENT_FOOTER_V4_LINES]);

    const bytes = await renderInscriptionDocumentPdf(model);
    const text = pdfVisibleText(bytes);
    expect(text).toMatch(/Article I/);
    expect(text).toMatch(/zoom\.us/i);
    expect(text).toMatch(/Montm/);
    expect(text).toMatch(/484/);
    expect(model.documentFooterLines.some((l) => l.includes("Version 4"))).toBe(
      true
    );
  });

  it("expose les articles en ligne comme helper", () => {
    const sections = buildOnlineConventionSections({
      language: "Anglais",
      datesLabel: "À planifier — début souhaité le 28 septembre 2026",
      durationHoursLabel: "12 heures",
      groupSizeLabel: "1",
      studentAddressLines: [],
      pedagogicalContact: "Paula Rangel-Halbwachs",
      paymentTermsLabel: "Coût pédagogique total : 600,00 €.",
    });
    expect(sections[0].title).toContain("Article I");
    expect(sections.some((s) => s.title.includes("Prix"))).toBe(true);
    expect(sections.some((s) => s.paragraphs.some((p) => p.includes("24 h")))).toBe(true);
  });

  it("renseigne dates à planifier et montants depuis les strings Supabase", async () => {
    const model = buildConventionPdfModel({
      inscription: {
        code: "FLI-260014",
        language: "Anglais",
        start_date: "2026-09-28",
        end_date: "2026-09-28",
        dates_to_confirm: true,
        duration_hours: "12",
        course_location: "En ligne",
        modality: "en_ligne_individuel",
        price: "600",
        deposit_amount: "150",
        balance_after_deposit: "450",
        group_size: 1,
        funding_organization: "FIFPL",
        payment_method: "virement",
      },
      student: {
        civility: "madame",
        first_name: "Cassandre",
        last_name: "Viard-Gaudin",
        street_address: "663, Route De Domelin ",
        postal_code: "73270",
        city: "Beaufort ",
        email: "cassandre.lore@gmail.com",
        phone: "0659223877",
        company: "ESF Courchevel Village",
      },
      identity: IDENTITY,
    });
    expect(model.studentCivility).toBe("Mme");
    expect(model.priceLabel).toContain("600");
    expect(model.depositLabel).toContain("150");
    expect(model.balanceLabel).toContain("450");
    expect(model.datesLabel).toMatch(/À planifier/);
    expect(model.studentAddressLines.join(" ")).toMatch(/Beaufort/);
    expect(model.paymentTermsLabel).toMatch(/virement/);

    const bytes = await renderInscriptionDocumentPdf(model);
    const text = pdfVisibleText(bytes);
    expect(text).toMatch(/600/);
    expect(text).toMatch(/150/);
    expect(text).toMatch(/450/);
    expect(text).toMatch(/Article V/);
    expect(text).toMatch(/Beaufort/);
  });

  it("construit le programme en ligne Version 2 (texte Paula)", async () => {
    const model = buildProgrammePdfModel({
      inscription: {
        code: "FLI-260014",
        language: "Anglais",
        start_date: "2026-09-28",
        end_date: "2026-09-28",
        dates_to_confirm: true,
        duration_hours: "12",
        course_location: "En ligne",
        modality: "en_ligne_individuel",
        price: "600",
        deposit_amount: "150",
        balance_after_deposit: "450",
        group_size: 1,
        funding_organization: "FIFPL",
        payment_method: "virement",
      },
      student: {
        civility: "madame",
        first_name: "Cassandre",
        last_name: "Viard-Gaudin",
        street_address: "663, Route De Domelin ",
        postal_code: "73270",
        city: "Beaufort ",
        company: "ESF Courchevel Village",
      },
      identity: IDENTITY,
      generatedAt: new Date("2026-09-24T10:00:00.000Z"),
    });
    expect(model.title).toMatch(/Formation individualisée/);
    expect(model.title).toMatch(/Anglais/);
    expect(model.documentFooterLines).toEqual([...FLI_DOCUMENT_FOOTER_V2_LINES]);
    expect(model.studentCompany).toBe("ESF Courchevel Village");
    expect(model.locationLabel).toMatch(/Cours en ligne/);
    expect(model.locationLabel).toMatch(/Beaufort/);
    expect(model.sections.some((s) => s.title === "Méthode et contenu")).toBe(true);
    expect(model.sections.some((s) => s.title === "Contenu prévisionnel")).toBe(true);
    expect(
      model.sections.some((s) =>
        s.paragraphs.some((p) => p.includes("Google Meet"))
      )
    ).toBe(true);

    const helper = buildOnlineProgrammeSections({
      language: "Anglais",
      durationHoursLabel: "12 heures",
    });
    expect(helper.some((s) => s.title === "Déroulement d'un cours")).toBe(true);

    const bytes = await renderInscriptionDocumentPdf(model);
    const text = pdfVisibleText(bytes);
    expect(text).toMatch(/Google Meet/);
    expect(text).toMatch(/ESF Courchevel Village/);
    expect(text).toMatch(/Version 2/);
    expect(text).toMatch(/Contenu pr/);
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const source = (rel: string) =>
      readFileSync(resolve(process.cwd(), rel), "utf8");
    const front = source("src/lib/inscription-documents-pdf.ts");
    const deno = source("supabase/functions/_shared/inscription-documents-pdf-model.ts");
    const extraire = (texte: string, nom: string) => {
      const debut = texte.indexOf(`export function ${nom}`);
      expect(debut).toBeGreaterThan(-1);
      const fin = texte.indexOf("\nexport ", debut + 1);
      return texte.slice(debut, fin === -1 ? undefined : fin);
    };
    expect(extraire(deno, "isOnlineModality")).toBe(extraire(front, "isOnlineModality"));
    expect(extraire(deno, "buildOnlineConventionSections")).toBe(
      extraire(front, "buildOnlineConventionSections")
    );
    expect(extraire(deno, "buildOnlineProgrammeSections")).toBe(
      extraire(front, "buildOnlineProgrammeSections")
    );
    expect(extraire(deno, "buildConventionPdfModel")).toBe(
      extraire(front, "buildConventionPdfModel")
    );
    expect(extraire(deno, "buildProgrammePdfModel")).toBe(
      extraire(front, "buildProgrammePdfModel")
    );
  });
});
