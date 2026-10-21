/**
 * Devis de formation (PDF simple) — dossier FAFCEA / parcours individualisé.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type DevisFormationPdfInput = {
  devisNumber: string;
  devisDate: Date;
  validityDays?: number;
  clientName: string;
  clientAddressLines: string[];
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  descriptionLines: string[];
  durationHours: number;
  hourlyRateEur: number;
  totalEur: number;
  fundingNote: string;
  letterheadPng?: Uint8Array | null;
};

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const NAVY = rgb(0.07, 0.18, 0.38);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.75, 0.78, 0.82);

const FLI = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  activity: "82 73 01 366 73",
} as const;

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[\u202f\u00a0]/g, " ")
    .replace(/€/g, "EUR");
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function pdfSafe(text: string): string {
  return text
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u202f/g, " ");
}

function wrapText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number
): string[] {
  const normalized = pdfSafe(text).replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) current = trial;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function devisFormationFilename(devisNumber: string): string {
  const safe = String(devisNumber || "devis")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-");
  return `Devis-${safe}.pdf`;
}

export async function renderDevisFormationPdf(
  input: DevisFormationPdfInput
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE.width, PAGE.height]);
  const maxW = PAGE.width - MARGIN * 2;
  let y = PAGE.height - MARGIN;

  if (input.letterheadPng?.length) {
    try {
      const img = await doc.embedPng(input.letterheadPng);
      const scale = Math.min(160 / img.width, 48 / img.height);
      page.drawImage(img, {
        x: MARGIN,
        y: y - img.height * scale,
        width: img.width * scale,
        height: img.height * scale,
      });
      y -= img.height * scale + 16;
    } catch {
      /* ignore */
    }
  } else {
    page.drawText(FLI.name, { x: MARGIN, y: y - 14, size: 14, font: bold, color: NAVY });
    y -= 28;
  }

  page.drawText(FLI.address, { x: MARGIN, y, size: 9, font: regular, color: MUTED });
  y -= 12;
  page.drawText(`${FLI.city} — ${FLI.phone}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: MUTED,
  });
  y -= 12;
  page.drawText(`SIRET ${FLI.siret} — NDA ${FLI.activity}`, {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: MUTED,
  });
  y -= 20;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE.width - MARGIN, y },
    thickness: 1,
    color: RULE,
  });
  y -= 28;

  page.drawText("DEVIS", { x: MARGIN, y, size: 20, font: bold, color: NAVY });
  y -= 22;
  page.drawText(`N° ${pdfSafe(input.devisNumber)}`, {
    x: MARGIN,
    y,
    size: 11,
    font: bold,
    color: INK,
  });
  y -= 14;
  page.drawText(`Date : ${formatDateFr(input.devisDate)}`, {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: INK,
  });
  y -= 14;
  const validity = input.validityDays ?? 90;
  page.drawText(`Validité : ${validity} jours`, {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: MUTED,
  });
  y -= 28;

  page.drawText("Client", { x: MARGIN, y, size: 12, font: bold, color: NAVY });
  y -= 16;
  page.drawText(pdfSafe(input.clientName), {
    x: MARGIN,
    y,
    size: 11,
    font: bold,
    color: INK,
  });
  y -= 14;
  for (const line of input.clientAddressLines) {
    page.drawText(pdfSafe(line), { x: MARGIN, y, size: 10, font: regular, color: INK });
    y -= 12;
  }
  if (input.clientEmail) {
    page.drawText(pdfSafe(input.clientEmail), {
      x: MARGIN,
      y,
      size: 10,
      font: regular,
      color: INK,
    });
    y -= 12;
  }
  if (input.clientPhone) {
    page.drawText(pdfSafe(input.clientPhone), {
      x: MARGIN,
      y,
      size: 10,
      font: regular,
      color: INK,
    });
    y -= 12;
  }
  y -= 16;

  page.drawText("Prestation", { x: MARGIN, y, size: 12, font: bold, color: NAVY });
  y -= 16;
  for (const line of wrapText(bold, input.title, 11, maxW)) {
    page.drawText(line, { x: MARGIN, y, size: 11, font: bold, color: INK });
    y -= 14;
  }
  y -= 4;
  for (const desc of input.descriptionLines) {
    for (const line of wrapText(regular, desc, 10, maxW)) {
      page.drawText(line, { x: MARGIN, y, size: 10, font: regular, color: INK });
      y -= 13;
    }
    y -= 4;
  }
  y -= 10;

  // Tableau tarifaire
  const colX = [MARGIN, MARGIN + 280, MARGIN + 360, MARGIN + 450];
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: maxW,
    height: 20,
    color: rgb(0.93, 0.94, 0.96),
  });
  page.drawText("Désignation", { x: colX[0] + 4, y, size: 9, font: bold, color: INK });
  page.drawText("Quantité", { x: colX[1], y, size: 9, font: bold, color: INK });
  page.drawText("P.U. HT", { x: colX[2], y, size: 9, font: bold, color: INK });
  page.drawText("Total HT", { x: colX[3], y, size: 9, font: bold, color: INK });
  y -= 22;
  page.drawText("Heures de formation", {
    x: colX[0] + 4,
    y,
    size: 10,
    font: regular,
    color: INK,
  });
  page.drawText(String(input.durationHours), {
    x: colX[1],
    y,
    size: 10,
    font: regular,
    color: INK,
  });
  page.drawText(formatEuro(input.hourlyRateEur), {
    x: colX[2],
    y,
    size: 10,
    font: regular,
    color: INK,
  });
  page.drawText(formatEuro(input.totalEur), {
    x: colX[3],
    y,
    size: 10,
    font: bold,
    color: INK,
  });
  y -= 28;

  page.drawText(`Total TTC* : ${formatEuro(input.totalEur)}`, {
    x: MARGIN,
    y,
    size: 13,
    font: bold,
    color: NAVY,
  });
  y -= 14;
  page.drawText("* Organisme exonéré de TVA (formulaire 3511).", {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: MUTED,
  });
  y -= 24;

  page.drawText("Financement", { x: MARGIN, y, size: 12, font: bold, color: NAVY });
  y -= 16;
  for (const line of wrapText(regular, input.fundingNote, 10, maxW)) {
    page.drawText(line, { x: MARGIN, y, size: 10, font: regular, color: INK });
    y -= 13;
  }
  y -= 20;

  page.drawText(
    "Document établi pour constituer un dossier de prise en charge FAFCEA.",
    { x: MARGIN, y, size: 9, font: regular, color: MUTED }
  );
  y -= 12;
  page.drawText("Qualiopi — organisme de formation certifié.", {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: MUTED,
  });

  return doc.save();
}
