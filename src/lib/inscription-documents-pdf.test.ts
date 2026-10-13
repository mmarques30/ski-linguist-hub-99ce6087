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
import { INSCRIPTION_DOCUMENT_ASSET_FILES } from "./inscription-documents-assets";
import {
  FLI_DOCUMENT_FOOTER_V2_LINES,
  FLI_DOCUMENT_FOOTER_V4_LINES,
} from "./organization-identity";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

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

function loadLetterheadPng(): Uint8Array {
  return new Uint8Array(
    readFileSync(
      resolve(
        process.cwd(),
        `public/inscription-documents/${INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead}`
      )
    )
  );
}

function loadSignaturePng(): Uint8Array {
  return new Uint8Array(
    readFileSync(
      resolve(
        process.cwd(),
        `public/inscription-documents/${INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature}`
      )
    )
  );
}

async function countPdfPages(bytes: Uint8Array): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

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
    const conventionBytes = await renderInscriptionDocumentPdf(convention, {
      letterheadPng: loadLetterheadPng(),
    });
    const programmeBytes = await renderInscriptionDocumentPdf(programme, {
      letterheadPng: loadLetterheadPng(),
    });
    expect(conventionBytes.byteLength).toBeGreaterThan(1000);
    expect(programmeBytes.byteLength).toBeGreaterThan(800);

    const cText = pdfVisibleText(conventionBytes);
    expect(cText).toMatch(/Alice/);
    expect(cText).toMatch(/Martin/);
    expect(cText).toMatch(/FLI-2026-TEST/);
    expect(cText).toMatch(/Anglais/);
    expect(cText).toMatch(/Formation Professionnelle Continue/);
    expect(cText).toMatch(/Page 1 \//);

    const pText = pdfVisibleText(programmeBytes);
    expect(pText).toMatch(/Programme/);
    expect(pText).toMatch(/Objectifs|Contenu/);
    expect(pText).toMatch(/Formation Professionnelle Continue/);
  });

  it("répète en-tête logo et pied FLI sur chaque page", async () => {
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
    const bytes = await renderInscriptionDocumentPdf(model, {
      organismSignaturePng: loadSignaturePng(),
      letterheadPng: loadLetterheadPng(),
    });
    const pages = await countPdfPages(bytes);
    expect(pages).toBeGreaterThanOrEqual(2);

    const text = pdfVisibleText(bytes);
    const footerHits = (text.match(/Formation Professionnelle Continue/g) || [])
      .length;
    expect(footerHits).toBeGreaterThanOrEqual(pages);

    for (let i = 1; i <= pages; i++) {
      expect(text).toContain(`Page ${i} / ${pages}`);
    }

    // Logo embarqué (XObject) : PDF nettement plus lourd qu'un texte seul.
    expect(bytes.byteLength).toBeGreaterThan(25_000);
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

    const bytes = await renderInscriptionDocumentPdf(model, {
      organismSignaturePng: loadSignaturePng(),
      letterheadPng: loadLetterheadPng(),
    });
    const text = pdfVisibleText(bytes);
    expect(text).toMatch(/Article I/);
    expect(text).toMatch(/zoom\.us/i);
    expect(text).toMatch(/Montm/);
    expect(text).toMatch(/484/);
    expect(model.documentFooterLines.some((l) => l.includes("Version 4"))).toBe(
      true
    );
    // Image embedded → PDF larger than text-only (~9 KB without signature).
    expect(bytes.byteLength).toBeGreaterThan(20_000);
  });

  it("expose les articles en ligne comme helper", () => {
    const sections = buildOnlineConventionSections({
      language: "Anglais",
      datesLabel: "À planifier — début souhaité le 28 septembre 2026",
      durationHoursLabel: "12 heures",
      groupSizeLabel: "1",
      studentAddressLines: [],
      pedagogicalContact: "Paula Rangel-Halbwachs",
      priceLabel: "600,00 €",
      depositLabel: "150,00 €",
      balanceLabel: "450,00 €",
    });
    expect(sections[0].title).toContain("Article I");
    expect(sections.some((s) => s.title.includes("Délai de rétractation"))).toBe(true);
    expect(sections.some((s) => s.title.includes("Dispositions financières"))).toBe(true);
    expect(sections.some((s) => s.title.includes("Accessibilité"))).toBe(true);
    expect(sections.some((s) => s.title.includes("Suivi de l'exécution"))).toBe(true);
    expect(sections.some((s) => s.paragraphs.some((p) => p.includes("24 h")))).toBe(true);
    expect(
      sections.some((s) => s.paragraphs.some((p) => p.includes("600,00") && p.includes("150,00")))
    ).toBe(true);
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

    const bytes = await renderInscriptionDocumentPdf(model, {
      letterheadPng: loadLetterheadPng(),
    });
    const text = pdfVisibleText(bytes);
    expect(text).toMatch(/600/);
    expect(text).toMatch(/150/);
    expect(text).toMatch(/450/);
    expect(text).toMatch(/Article V/);
    expect(text).toMatch(/r.tractation|rtractation/i);
    expect(text).toMatch(/Article VI/);
    expect(text).toMatch(/Article IX/);
    expect(text).toMatch(/Beaufort/);
    expect(text).toMatch(/double exemplaire/);
    expect(text).toMatch(/Formation Professionnelle Continue/);
  });

  it("détaille acompte en ligne + solde chèque à FLI Montmélian (cas Marmottan)", () => {
    const model = buildConventionPdfModel({
      inscription: {
        code: "FLI-260041",
        language: "Portugais",
        start_date: "2026-11-23",
        end_date: "2026-11-27",
        duration_hours: 24,
        course_location: "ESF Val d'Isère",
        modality: "presentiel",
        price: 900,
        deposit_amount: 150,
        balance_after_deposit: 750,
        group_size: 1,
        funding_organization: "FIFPL",
        payment_method: "cheque",
      },
      student: {
        first_name: "Barbara",
        last_name: "Marmottan",
        street_address: "144 route des Moulins",
        postal_code: "73640",
        city: "Sainte-Foy",
        email: "barbaramarmottan@gmail.com",
        phone: "+33670568664",
        company: "ESF Val d'Isère",
      },
      identity: IDENTITY,
    });
    expect(model.paymentTermsLabel).toMatch(/paiement sécurisé en ligne/i);
    expect(model.paymentTermsLabel).toMatch(/150/);
    expect(model.paymentTermsLabel).toMatch(/750/);
    expect(model.paymentTermsLabel).toMatch(/par chèque/i);
    expect(model.paymentTermsLabel).toMatch(/25 avenue de la Gare/);
    expect(model.paymentTermsLabel).toMatch(/73800 Montmélian/);
    expect(model.paymentTermsLabel).not.toMatch(/mode : chèque/i);
    const front = readFileSync(
      join(process.cwd(), "src/lib/inscription-documents-pdf.ts"),
      "utf8"
    );
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/inscription-documents-pdf-model.ts"),
      "utf8"
    );
    expect(front).toContain("par chèque à l'ordre de France Langues International");
    expect(deno).toContain("par chèque à l'ordre de France Langues International");

    const modern = buildConventionPdfModel({
      inscription: {
        code: "FLI-260041",
        language: "Portugais",
        start_date: "2026-11-23",
        end_date: "2026-11-27",
        duration_hours: 24,
        course_location: "ESF Val d'Isère",
        modality: "presentiel",
        price: 900,
        deposit_amount: 150,
        balance_after_deposit: 750,
        group_size: 1,
        funding_organization: "FIFPL",
        payment_method: "stripe_deposit_cheque",
      },
      student: {
        first_name: "Barbara",
        last_name: "Marmottan",
        company: "ESF Val d'Isère",
      },
      identity: IDENTITY,
    });
    expect(modern.paymentTermsLabel).toMatch(/paiement sécurisé en ligne/i);
    expect(modern.paymentTermsLabel).not.toMatch(/mode : chèque/i);
    expect(modern.paymentTermsLabel).toMatch(/par chèque/i);
  });

  it("détaille chèque FIF-PL moniteur + solde ESF (La Rosière)", () => {
    const model = buildConventionPdfModel({
      inscription: {
        code: "FLI-260027",
        language: "Portugais",
        start_date: "2026-11-30",
        end_date: "2026-12-11",
        duration_hours: 40,
        course_location: "ESF La Rosière",
        modality: "presentiel",
        price: 1500,
        deposit_amount: null,
        balance_after_deposit: 900,
        group_size: 8,
        funding_organization: "FIFPL",
        payment_method: "cheque_fifpl_ecole",
      },
      student: {
        first_name: "Christelle",
        last_name: "Gaidet",
        street_address: "447 toute des Etaves",
        postal_code: "73700",
        city: "Montvalezan",
        email: "chrisg73@orange.fr",
        phone: "0685923468",
        company: "ESF La Rosière",
      },
      identity: IDENTITY,
    });
    expect(model.priceLabel).toContain("1");
    expect(model.balanceLabel).toContain("900");
    expect(model.paymentTermsLabel).toMatch(/900/);
    expect(model.paymentTermsLabel).toMatch(/600/);
    expect(model.paymentTermsLabel).toMatch(/1\s?500|1500/);
    expect(model.paymentTermsLabel).toMatch(/règlement intégral en ligne/i);
    expect(model.paymentTermsLabel).toMatch(/chèque FIF-PL/i);
    expect(model.paymentTermsLabel).toMatch(/25 avenue de la Gare/);
    expect(model.paymentTermsLabel).toMatch(/73800 Montmélian/);
    expect(model.paymentTermsLabel).toMatch(/ESF/);
    expect(model.paymentTermsLabel).toMatch(/Prise en charge ESF/);
    expect(model.paymentTermsLabel).not.toMatch(/jamais à celle de l'ESF/);
    expect(model.paymentTermsLabel).not.toMatch(/150/);
    expect(model.paymentTermsLabel).not.toMatch(/frais de dossier/i);
    expect(model.paymentTermsLabel).not.toMatch(/remettre via|votre école de ski/i);
    expect(model.hideDepositFee).toBe(true);
    expect(model.balanceRowLabel).toBe("Votre part");
    expect(model.schoolCoverageLabel).toMatch(/600/);
    expect(
      model.sections.some(
        (s) =>
          s.title === "Tarif et règlement" &&
          s.paragraphs.some((p) => p.includes("Aucun frais de dossier"))
      )
    ).toBe(true);
    expect(
      model.sections.some(
        (s) =>
          s.title === "Tarif et règlement" &&
          s.paragraphs.some((p) => p.includes("150 €"))
      )
    ).toBe(false);
  });

  it("masque les 150 € sur convention Méribel (forfait école)", () => {
    const model = buildConventionPdfModel({
      inscription: {
        code: "FLI-260099",
        language: "Anglais",
        start_date: "2026-11-30",
        end_date: "2026-12-04",
        duration_hours: 24,
        course_location: "ESF Méribel",
        modality: "presentiel",
        price: 900,
        deposit_amount: null,
        balance_after_deposit: 900,
        group_size: 8,
        funding_organization: "FIFPL",
        payment_method: "stripe",
      },
      student: {
        first_name: "Test",
        last_name: "Meribel",
        company: "ESF Méribel",
      },
      identity: IDENTITY,
    });
    expect(model.hideDepositFee).toBe(true);
    expect(model.schoolCoverageLabel).toBeNull();
    expect(model.paymentTermsLabel).not.toMatch(/150/);
    expect(model.paymentTermsLabel).toMatch(/règlement intégral en ligne/i);
    expect(model.paymentTermsLabel).toMatch(/chèque FIF-PL/i);
    expect(model.paymentTermsLabel).not.toMatch(/remettre via|votre école de ski/i);
    expect(
      model.sections.some(
        (s) =>
          s.title === "Tarif et règlement" &&
          s.paragraphs.some((p) => p.includes("150 €"))
      )
    ).toBe(false);
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

    const bytes = await renderInscriptionDocumentPdf(model, {
      letterheadPng: loadLetterheadPng(),
    });
    const text = pdfVisibleText(bytes);
    expect(text).toMatch(/Google Meet/);
    expect(text).toMatch(/ESF Courchevel Village/);
    expect(text).toMatch(/Version 2/);
    expect(text).toMatch(/Contenu pr/);
    expect(text).toMatch(/Formation Professionnelle Continue/);
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
    expect(extraire(deno, "isSchoolStationConvention")).toBe(
      extraire(front, "isSchoolStationConvention")
    );

    const frontCgv = source("src/lib/conditions-generales-content.ts");
    const denoCgv = source(
      "supabase/functions/_shared/conditions-generales-content.ts"
    );
    expect(denoCgv).toBe(frontCgv);

    const frontAssets = source("src/lib/inscription-documents-assets.ts");
    const denoAssets = source(
      "supabase/functions/_shared/inscription-documents-assets.ts"
    );
    expect(frontAssets).toContain("letterhead");
    expect(denoAssets).toContain("letterhead");
    expect(denoAssets).toContain("loadInscriptionLetterhead");
    expect(denoAssets).toContain("inscription-documents-letterhead-b64");
  });
});
