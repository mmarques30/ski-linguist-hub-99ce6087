/**
 * Pack DSF Steven Mandica — facture + contrat.
 * Résultat PDF/Word : mise en page = .dotx rempli
 *   → python3 scripts/fill-dsf-eval-dotx.py
 *   → python3 scripts/prepare-dsf-mandica-word.py
 *
 *   ./node_modules/.bin/tsx scripts/prepare-dsf-mandica-pack.mts
 * Aucun envoi Resend.
 */
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  buildEvaluationPdfModel,
  type CecrlScaleRow,
  type EvaluationPdfInput,
  type FliIdentity,
} from "../src/lib/evaluation-pdf.ts";
import {
  EVALUATION_PDF_ASSET_FILES,
  type EvaluationPdfAssets,
} from "../src/lib/evaluation-pdf-assets.ts";
import { renderEvaluationPdf } from "../src/lib/evaluation-pdf-render.ts";
import { FLI_BANK_DETAILS } from "../src/lib/registration-payments.ts";

const OUT = "/opt/cursor/artifacts/mollard-oct-2026/dsf-mandica";
const UPLOADS = "/home/ubuntu/.cursor/projects/workspace/uploads";

const IDENTITY: FliIdentity = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
};

const SCALE: CecrlScaleRow[] = [
  { score: 0, cecrl_label: "A1", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Eveil" },
  { score: 0.5, cecrl_label: "A1+", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Eveil" },
  { score: 1, cecrl_label: "A2", base_label: "A2", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 1.5, cecrl_label: "A2+", base_label: "A2", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 2, cecrl_label: "B1", base_label: "B1", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 2.5, cecrl_label: "B1+", base_label: "B1", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 3, cecrl_label: "B2", base_label: "B2", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 3.5, cecrl_label: "B2+", base_label: "B2", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 4, cecrl_label: "C1", base_label: "C1", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 4.5, cecrl_label: "C1+", base_label: "C1", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 5, cecrl_label: "C2", base_label: "C2", niveau: 5, description: "Maîtrise" },
];

const YELLOW = rgb(252 / 255, 175 / 255, 23 / 255);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);

const FLI = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  tvaNumber: "FR 44 484772041",
  iban: FLI_BANK_DETAILS.iban,
  bic: FLI_BANK_DETAILS.bic,
  activity: "82 73 01 366 73",
} as const;

const CLIENT = {
  name: "DSF Formation — Domaines Skiables de France Formation",
  address: "Alpespace Bât. Annapurna - 24 rue Saint-Exupéry, CS 80600",
  postalCode: "73802",
  city: "PORTE-DE-SAVOIE",
};

function formatFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
function formatEuro(amount: number): string {
  const fixed = amount.toFixed(2).replace(".", ",");
  const [intPart, dec] = fixed.split(",");
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")},${dec}\u00a0€`;
}

async function loadPublic(path: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(join(process.cwd(), "public", path)));
  } catch {
    return null;
  }
}

async function loadAssets(): Promise<EvaluationPdfAssets> {
  const dir = join(process.cwd(), "public/evaluation-pdf");
  const read = async (file: string) => readFile(join(dir, file));
  const partners: Uint8Array[] = [];
  for (const file of EVALUATION_PDF_ASSET_FILES.partners) {
    partners.push(await read(file));
  }
  return {
    esfLogo: await read(EVALUATION_PDF_ASSET_FILES.esfLogo),
    fliHeader: await read(EVALUATION_PDF_ASSET_FILES.fliHeader),
    fliCachet: await read(EVALUATION_PDF_ASSET_FILES.fliCachet),
    fliCompact: await read(EVALUATION_PDF_ASSET_FILES.fliCompact),
    dsfLetterhead: await read(EVALUATION_PDF_ASSET_FILES.dsfLetterhead),
    partnerLogos: partners,
  };
}

async function buildInvoicePdf(): Promise<Uint8Array> {
  const amountHt = 42;
  const tvaRate = 20;
  const tvaAmount = (amountHt * tvaRate) / 100;
  const amountTtc = 50.4;
  const invoiceNumber = "26-27.14335";
  const invoiceDate = "2026-10-14";
  const dueDate = "2026-11-30";

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([595.28, 841.89]);
  const regular = await loadPublic("fonts/Inter-Regular.ttf");
  const bold = await loadPublic("fonts/Inter-SemiBold.ttf");
  const font: PDFFont = regular?.byteLength
    ? await doc.embedFont(regular, { subset: true })
    : await doc.embedFont(StandardFonts.Helvetica);
  const fontBold: PDFFont = bold?.byteLength
    ? await doc.embedFont(bold, { subset: true })
    : await doc.embedFont(StandardFonts.HelveticaBold);

  const left = 48;
  const right = 595.28 - 48;
  let y = 841.89 - 48;
  const draw = (
    text: string,
    x: number,
    baseline: number,
    opts?: { bold?: boolean; size?: number; color?: typeof INK }
  ) => {
    page.drawText(text, {
      x,
      y: baseline,
      size: opts?.size ?? 10,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? INK,
    });
  };

  const logoBytes = await loadPublic(
    "inscription-documents/fli-invoice-logo.png"
  );
  if (logoBytes?.byteLength) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const w = 140;
      const h = (logo.height / logo.width) * w;
      page.drawImage(logo, { x: left, y: y - h, width: w, height: h });
      y -= h + 8;
    } catch {
      draw(FLI.name, left, y - 14, { bold: true, size: 12 });
      y -= 20;
    }
  }

  const headerTop = 841.89 - 52;
  draw("FACTURE - Test de niveau", right - 200, headerTop - 4, {
    bold: true,
    size: 14,
    color: YELLOW,
  });
  draw(`N°: ${invoiceNumber}`, right - 140, headerTop - 24, {
    bold: true,
    size: 10,
  });
  draw(`Date: ${formatFr(invoiceDate)}`, right - 140, headerTop - 38, {
    size: 9,
    color: MUTED,
  });
  draw(`Échéance: ${formatFr(dueDate)}`, right - 140, headerTop - 50, {
    size: 9,
    color: MUTED,
  });

  for (const line of [
    FLI.name,
    FLI.address,
    FLI.city,
    `Tél: ${FLI.phone}`,
    FLI.email,
  ]) {
    draw(line, left, y, {
      size: 9,
      color: line === FLI.name ? INK : MUTED,
      bold: line === FLI.name,
    });
    y -= 12;
  }
  y -= 10;
  page.drawRectangle({
    x: left,
    y: y - 2,
    width: right - left,
    height: 2.5,
    color: YELLOW,
  });
  y -= 24;

  page.drawRectangle({
    x: left,
    y: y - 78,
    width: right - left,
    height: 86,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(CLIENT.name, left + 12, y - 30, { bold: true, size: 10 });
  draw(CLIENT.address, left + 12, y - 44, { size: 9 });
  draw(`${CLIENT.postalCode} ${CLIENT.city}`, left + 12, y - 56, { size: 9 });
  draw("À l'attention de Fabienne Rozier", left + 12, y - 68, { size: 9 });
  y -= 104;

  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 16;
  draw("Description", left, y, { bold: true, size: 9, color: MUTED });
  draw("Qté", left + 280, y, { bold: true, size: 9, color: MUTED });
  draw("Prix unit.", left + 330, y, { bold: true, size: 9, color: MUTED });
  draw("Montant", right - 60, y, { bold: true, size: 9, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;
  draw("Test d'anglais — Steven Mandica (TPH Salève)", left, y, { size: 10 });
  draw("Contrat n° 26 338 — 08/10/2026", left, y - 12, {
    size: 8,
    color: MUTED,
  });
  draw("1", left + 290, y, { size: 10 });
  draw(formatEuro(amountHt), left + 330, y, { size: 10 });
  const tot = formatEuro(amountHt);
  draw(tot, right - fontBold.widthOfTextAtSize(tot, 10), y, {
    bold: true,
    size: 10,
  });
  y -= 40;

  const boxX = right - 220;
  const row = (
    label: string,
    value: string,
    opts?: { bold?: boolean; color?: typeof INK; size?: number }
  ) => {
    draw(label, boxX, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? MUTED,
    });
    const vw = (opts?.bold ? fontBold : font).widthOfTextAtSize(
      value,
      opts?.size ?? 10
    );
    draw(value, right - vw, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? INK,
    });
    y -= 16;
  };
  row("Total HT", formatEuro(amountHt));
  row(`TVA (${tvaRate}%)`, formatEuro(tvaAmount));
  page.drawLine({
    start: { x: boxX, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 18;
  row("Total TTC", formatEuro(amountTtc), {
    bold: true,
    color: YELLOW,
    size: 12,
  });

  y = Math.min(y - 24, 220);
  page.drawLine({
    start: { x: left, y: y + 12 },
    end: { x: right, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  draw("COORDONNÉES BANCAIRES", left, y, { size: 8, color: MUTED, bold: true });
  draw(`IBAN: ${FLI.iban}`, left, y - 14, { size: 9 });
  draw(`BIC: ${FLI.bic}`, left, y - 28, { size: 9 });
  draw("Réf. à indiquer : 26-27.14335 / Contrat 26 338", left, y - 42, {
    size: 9,
  });
  draw(`SIRET: ${FLI.siret}`, right - 160, y - 14, { size: 9, color: MUTED });
  draw(`N° TVA: ${FLI.tvaNumber}`, right - 160, y - 28, {
    size: 9,
    color: MUTED,
  });

  return doc.save();
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const input: EvaluationPdfInput = {
    sponsorType: "dsf",
    evaluatedAt: new Date("2026-10-08T12:00:00+00:00"),
    candidateName: "Steven Mandica",
    candidateProfession: null,
    skiDiscipline: null,
    trainingCycle: null,
    carteSyndicale: null,
    language: "anglais",
    previousTest: false,
    skiSchoolName: "Téléphérique du Salève",
    companyName: "Téléphérique du Salève",
    instructorName: "Carole Mollard",
    scores: {
      comprehension: 3.5,
      expression: 3.5,
      structure: 3.5,
      technique: 3.5,
      conversation: 3.5,
      general: 3.5,
    },
    cecrlGeneral: "B2+",
    blocs: {
      introduction: "Vous vous exprimez d'une façon assez claire et autonome.",
      comprehension:
        "Vous avez plutôt bien compris le texte audio et moi-même. Vous avez de bonnes bases en grammaire et vous êtes capable de vous exprimer dans tous les temps.",
      technique:
        "En ce qui concerne la partie spécifique à votre métier, vous vous exprimez avec enthousiasme et précision.",
      conclusion:
        "En conclusion vous avez un niveau opérationnel qui vous permet de communiquer correctement avec la clientèle anglophone. Continuez néanmoins à développer l'apprentissage de vos connaissances, vous gagnerez en aisance et en fluidité.",
    },
    noteMethodologique: null,
    priceTtc: null,
    identity: IDENTITY,
    cecrlScale: SCALE,
    verifiedAt: new Date("2026-10-14T07:32:40+00:00"),
  };

  // Ne pas écraser le PDF issu du .dotx (fill-dsf-eval-dotx.py).
  const pdfName = "evaluation-Steven-Mandica-anglais-DSF.pdf";
  console.log(
    "PDF résultat : générer via python3 scripts/fill-dsf-eval-dotx.py →",
    pdfName
  );

  const invBytes = await buildInvoicePdf();
  const invName = "Facture-26-27.14335-DSF-Mandica.pdf";
  await writeFile(join(OUT, invName), invBytes);
  console.log("INV", invName, invBytes.length);

  await copyFile(
    join(
      UPLOADS,
      "26_338-Contrat_Presta-Test_anglais_08.10-TPH_Sale_ve_c421.pdf"
    ),
    join(OUT, "Contrat-26-338-TPH-Saleve.pdf")
  );

  await writeFile(
    join(OUT, "pack-meta.json"),
    JSON.stringify(
      {
        candidate: "Steven Mandica",
        company: "Téléphérique du Salève",
        sponsor: "dsf",
        cecrl: "B2+",
        scores: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
        test_date: "2026-10-08",
        contract: "26 338",
        invoice_number: "26-27.14335",
        invoice_id: "b07fffc8-dc3d-4e57-8ead-3ba9ac5a069b",
        amount_ht: 42,
        amount_ttc: 50.4,
        invoice_status: "draft",
        to: "f.rozier@domaines-skiables.fr",
        recipient: "Fabienne Rozier",
        tutoiement: true,
        send: false,
        files: {
          pdf: pdfName,
          invoice: invName,
          contract: "Contrat-26-338-TPH-Saleve.pdf",
        },
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
