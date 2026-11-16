/**
 * Pack DSF — formation Anglais appliqué spécifique pisteurs, Les 2 Alpes
 * (11–13 nov. 2026, groupe PS1-2ALPES, formateur Michèle Looten).
 *
 * Produit : facture PDF (sous-traitance 20 % TVA) + métadonnées.
 * Rapport niveaux / appréciation : scripts/prepare-dsf-pisteurs-2alpes-nov2026-report.py
 * Aucun envoi Resend.
 *
 *   ./node_modules/.bin/tsx scripts/prepare-dsf-pisteurs-2alpes-nov2026-pack.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { FLI_BANK_DETAILS } from "../src/lib/registration-payments.ts";

const OUT = "/opt/cursor/artifacts/dsf-pisteurs-2alpes-nov2026";

/** Tarif historique encadrement pisteurs 2 Alpes (sans IK — pratique 2025). */
const AMOUNT_HT = 1992;
const TVA_RATE = 20;
const AMOUNT_TTC = AMOUNT_HT * (1 + TVA_RATE / 100);

/** Remplacé après INSERT DB si le numéro diffère. */
const INVOICE_NUMBER_PLACEHOLDER = "26-27.14344";
const INVOICE_DATE = "2026-11-16";
const DUE_DATE = "2026-12-16";
const COURSE_START = "2026-11-11";
const COURSE_END = "2026-11-13";
const DURATION_HOURS = 21;
const LOCATION = "Les 2 Alpes — Le Chalet des Glaciers";
const INSCRIPTION_CLIENT_ID = "70b56f77-cddd-4ae7-a5c4-2fe4c7ae18f7";

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
  attention: "À l'attention de Fabienne Rozier",
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

export async function buildInvoicePdf(
  invoiceNumber: string
): Promise<Uint8Array> {
  const amountHt = AMOUNT_HT;
  const tvaAmount = (amountHt * TVA_RATE) / 100;
  const amountTtc = AMOUNT_TTC;

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
  draw("FACTURE - Sous-traitance", right - 210, headerTop - 4, {
    bold: true,
    size: 13,
    color: YELLOW,
  });
  draw(`N°: ${invoiceNumber}`, right - 140, headerTop - 24, {
    bold: true,
    size: 10,
  });
  draw(`Date: ${formatFr(INVOICE_DATE)}`, right - 140, headerTop - 38, {
    size: 9,
    color: MUTED,
  });
  draw(`Échéance: ${formatFr(DUE_DATE)}`, right - 140, headerTop - 50, {
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
    y: y - 90,
    width: right - left,
    height: 98,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(CLIENT.name, left + 12, y - 30, { bold: true, size: 10 });
  draw(CLIENT.address, left + 12, y - 44, { size: 9 });
  draw(`${CLIENT.postalCode} ${CLIENT.city}`, left + 12, y - 56, { size: 9 });
  draw(CLIENT.attention, left + 12, y - 70, { size: 9 });
  y -= 116;

  page.drawRectangle({
    x: left,
    y: y - 44,
    width: right - left,
    height: 52,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });
  draw("PÉRIODE DE FORMATION", left + 12, y - 14, {
    size: 8,
    color: MUTED,
    bold: true,
  });
  draw(
    `Du ${formatFr(COURSE_START)} au ${formatFr(COURSE_END)}`,
    left + 12,
    y - 30,
    { size: 10, bold: true }
  );
  draw("DURÉE", right - 120, y - 14, { size: 8, color: MUTED, bold: true });
  draw(`${DURATION_HOURS} heures`, right - 120, y - 30, {
    size: 10,
    bold: true,
  });
  y -= 64;

  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 16;
  draw("Description", left, y, { bold: true, size: 9, color: MUTED });
  draw("Qté", left + 300, y, { bold: true, size: 9, color: MUTED });
  draw("Montant", right - 60, y, { bold: true, size: 9, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;
  draw("Encadrement d'une formation en", left, y, { size: 10 });
  draw("Anglais appliqué spécifique Pisteurs — 2 Alpes", left, y - 12, {
    size: 10,
  });
  draw(`Lieu : ${LOCATION}`, left, y - 24, { size: 8, color: MUTED });
  draw("Formateur : Michèle Looten · groupe PS1-2ALPES", left, y - 36, {
    size: 8,
    color: MUTED,
  });
  draw("1", left + 310, y, { size: 10 });
  const tot = formatEuro(amountHt);
  draw(tot, right - fontBold.widthOfTextAtSize(tot, 10), y, {
    bold: true,
    size: 10,
  });
  y -= 56;

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
  row(`TVA (${TVA_RATE}%)`, formatEuro(tvaAmount));
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
  draw(`Réf. à indiquer : ${invoiceNumber}`, left, y - 42, { size: 9 });
  draw(`SIRET: ${FLI.siret}`, right - 160, y - 14, { size: 9, color: MUTED });
  draw(`N° TVA: ${FLI.tvaNumber}`, right - 160, y - 28, {
    size: 9,
    color: MUTED,
  });
  draw(`Org. formation n° ${FLI.activity}`, right - 160, y - 42, {
    size: 8,
    color: MUTED,
  });

  const footer = [
    "Règlement par virement à 30 jours date de facture. Aucun escompte pour règlement anticipé.",
    "France Langues International — SARL au capital de 5000 € — 25 avenue de la gare, 73800 Montmélian",
    `Siret : ${FLI.siret} — RCS Chambéry — NAF 8559A — Organisme n° ${FLI.activity}`,
  ];
  let fy = 58;
  for (const line of footer) {
    const w = font.widthOfTextAtSize(line, 7);
    draw(line, (595.28 - w) / 2, fy, { size: 7, color: MUTED });
    fy -= 10;
  }

  return doc.save();
}

async function main() {
  const invoiceNumber =
    process.env.INVOICE_NUMBER?.trim() || INVOICE_NUMBER_PLACEHOLDER;
  await mkdir(OUT, { recursive: true });
  const pdf = await buildInvoicePdf(invoiceNumber);
  const invName = `Facture-${invoiceNumber}-DSF-Pisteurs-2Alpes.pdf`;
  await writeFile(join(OUT, invName), pdf);

  const meta = {
    invoiceNumber,
    invoiceDate: INVOICE_DATE,
    dueDate: DUE_DATE,
    amountHt: AMOUNT_HT,
    tvaRate: TVA_RATE,
    amountTtc: AMOUNT_TTC,
    invoiceType: "soustraitance",
    clientType: "dsf",
    inscriptionId: INSCRIPTION_CLIENT_ID,
    courseStart: COURSE_START,
    courseEnd: COURSE_END,
    durationHours: DURATION_HOURS,
    location: LOCATION,
    designation:
      "Encadrement d'une formation en Anglais appliqué spécifique Pisteurs 2 Alpes",
    notes: [
      "DSF Formation — Encadrement d'une formation en Anglais appliqué spécifique Pisteurs  2 Alpes",
      `Groupe PS1-2ALPES · ${DURATION_HOURS} h · ${formatFr(COURSE_START)} → ${formatFr(COURSE_END)}`,
      "Formateur : Michèle Looten",
      "Tarif historique encadrement 1 992 € HT (sans IK — même pratique que facture 25-26.14081).",
      "Fiche client app (FLI-260130) affichait 1 980 € : alignée sur 1 992 € pour cette facture.",
    ].join("\n"),
    pdf: invName,
  };
  await writeFile(join(OUT, "invoice-meta.json"), JSON.stringify(meta, null, 2));
  console.log(JSON.stringify({ ok: true, out: OUT, ...meta }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
