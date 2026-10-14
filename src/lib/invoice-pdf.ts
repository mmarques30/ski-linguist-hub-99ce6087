/**
 * Facture PDF (format officiel aligné sur InvoiceTemplate).
 * Utilisé par le pack fin de formation (PJ e-mail + Storage).
 *
 * Police : Inter (comme le back-office / InvoiceTemplate à l'écran),
 * pas Helvetica standard.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export const INVOICE_LOGO_PUBLIC_PATH =
  "inscription-documents/fli-invoice-logo.png";
export const INVOICE_PAID_STAMP_PUBLIC_PATH =
  "inscription-documents/facture-acquittee-stamp.png";
/** Même famille que `body { font-family: Inter }` dans index.css. */
export const INVOICE_FONT_REGULAR_PATH = "fonts/Inter-Regular.ttf";
export const INVOICE_FONT_SEMIBOLD_PATH = "fonts/Inter-SemiBold.ttf";

export interface InvoicePdfInput {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  status: "draft" | "sent" | "en_attente" | "a_relancer" | "paid" | "cancelled" | "a_verifier";
  clientName: string;
  clientAddress?: string | null;
  clientPostalCode?: string | null;
  clientCity?: string | null;
  clientCompany?: string | null;
  courseDescription?: string | null;
  courseDateStart?: string | null;
  courseDateEnd?: string | null;
  courseDurationHours?: number | null;
  courseLocation?: string | null;
  amountHt: number;
  amountTtc?: number | null;
  acompteAmount?: number | null;
  acompteDate?: string | null;
  paymentDate?: string | null;
  paymentMethodLabel?: string | null;
  logoPngBytes?: Uint8Array | null;
  paidStampPngBytes?: Uint8Array | null;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const YELLOW = rgb(252 / 255, 175 / 255, 23 / 255);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const GREEN = rgb(0.1, 0.45, 0.2);

const FLI = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  iban: "FR76 1820 6004 4339 5412 7300 144",
  bic: "AGRIFRPP882",
  activity: "82 73 01 366 73",
} as const;

function formatFr(iso: string | null | undefined): string {
  if (!iso) return "";
  const raw = String(iso).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return raw;
}

function formatEuro(amount: number): string {
  const fixed = amount.toFixed(2).replace(".", ",");
  const [intPart, dec] = fixed.split(",");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${withSpaces},${dec}\u00a0€`;
}

async function loadPublicAssetBytes(
  publicRelativePath: string,
  override?: Uint8Array | null
): Promise<Uint8Array | null> {
  if (override && override.byteLength > 0) return override;
  if (typeof globalThis.fetch === "function") {
    try {
      const res = await fetch(`/${publicRelativePath}`);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch {
      /* Node */
    }
  }
  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    return new Uint8Array(
      readFileSync(join(process.cwd(), "public", publicRelativePath))
    );
  } catch {
    return null;
  }
}

export function invoicePdfFilename(invoiceNumber: string): string {
  const safe = String(invoiceNumber || "facture")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-");
  return `Facture-${safe}.pdf`;
}

export function buildInvoicePdfPath(
  studentId: string,
  inscriptionId: string,
  invoiceNumber: string
): string {
  return `${studentId}/${inscriptionId}/${invoicePdfFilename(invoiceNumber)}`;
}

async function embedInvoiceFonts(doc: PDFDocument): Promise<{
  font: PDFFont;
  fontBold: PDFFont;
}> {
  doc.registerFontkit(fontkit);
  const regularBytes = await loadPublicAssetBytes(INVOICE_FONT_REGULAR_PATH);
  const boldBytes = await loadPublicAssetBytes(INVOICE_FONT_SEMIBOLD_PATH);
  if (regularBytes?.byteLength && boldBytes?.byteLength) {
    return {
      font: await doc.embedFont(regularBytes, { subset: true }),
      fontBold: await doc.embedFont(boldBytes, { subset: true }),
    };
  }
  // Fallback uniquement si les fichiers Inter sont absents.
  return {
    font: await doc.embedFont(StandardFonts.Helvetica),
    fontBold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
}

export async function buildInvoicePdfBytes(
  input: InvoicePdfInput
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const { font, fontBold } = await embedInvoiceFonts(doc);
  const left = 48;
  const right = PAGE_W - 48;
  let y = PAGE_H - 48;

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

  const logoBytes = await loadPublicAssetBytes(
    INVOICE_LOGO_PUBLIC_PATH,
    input.logoPngBytes
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
  } else {
    draw(FLI.name, left, y - 14, { bold: true, size: 12 });
    y -= 20;
  }

  const headerTop = PAGE_H - 52;
  draw("FACTURE", right - 120, headerTop - 4, {
    bold: true,
    size: 18,
    color: YELLOW,
  });
  draw(`N°: ${input.invoiceNumber}`, right - 140, headerTop - 24, {
    bold: true,
    size: 10,
  });
  draw(`Date: ${formatFr(input.invoiceDate)}`, right - 140, headerTop - 38, {
    size: 9,
    color: MUTED,
  });
  if (input.dueDate) {
    draw(`Échéance: ${formatFr(input.dueDate)}`, right - 140, headerTop - 50, {
      size: 9,
      color: MUTED,
    });
  }

  const orgLines = [
    FLI.name,
    FLI.address,
    FLI.city,
    `Tél: ${FLI.phone}`,
    FLI.email,
  ];
  let oy = y;
  for (const line of orgLines) {
    draw(line, left, oy, {
      size: 9,
      color: line === FLI.name ? INK : MUTED,
      bold: line === FLI.name,
    });
    oy -= 12;
  }
  y = oy - 10;

  page.drawRectangle({
    x: left,
    y: y - 2,
    width: right - left,
    height: 2.5,
    color: YELLOW,
  });
  y -= 24;

  // Client
  page.drawRectangle({
    x: left,
    y: y - 70,
    width: right - left,
    height: 78,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(input.clientName, left + 12, y - 30, { bold: true, size: 11 });
  let cy = y - 44;
  if (input.clientCompany) {
    draw(input.clientCompany, left + 12, cy, { size: 9 });
    cy -= 12;
  }
  if (input.clientAddress) {
    draw(input.clientAddress, left + 12, cy, { size: 9 });
    cy -= 12;
  }
  draw(
    `${input.clientPostalCode || ""} ${input.clientCity || ""}`.trim(),
    left + 12,
    cy,
    { size: 9 }
  );
  y -= 96;

  // Période
  if (input.courseDateStart && input.courseDateEnd) {
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
      `Du ${formatFr(input.courseDateStart)} au ${formatFr(input.courseDateEnd)}`,
      left + 12,
      y - 30,
      { size: 10, bold: true }
    );
    if (input.courseDurationHours != null) {
      draw("DURÉE", right - 120, y - 14, { size: 8, color: MUTED, bold: true });
      draw(`${input.courseDurationHours} heures`, right - 120, y - 30, {
        size: 10,
        bold: true,
      });
    }
    if (input.courseLocation) {
      draw("LIEU", right - 220, y - 14, { size: 8, color: MUTED, bold: true });
      draw(input.courseLocation, right - 220, y - 30, { size: 10, bold: true });
    }
    y -= 64;
  }

  // Table header
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 16;
  draw("Description", left, y, { bold: true, size: 9, color: MUTED });
  draw("Montant", right - 60, y, { bold: true, size: 9, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;
  draw(input.courseDescription || "Formation linguistique", left, y, {
    bold: true,
    size: 10,
  });
  if (input.courseLocation) {
    draw(`Lieu: ${input.courseLocation}`, left, y - 12, {
      size: 8,
      color: MUTED,
    });
  }
  const amountLabel = formatEuro(input.amountHt);
  const amountW = fontBold.widthOfTextAtSize(amountLabel, 10);
  draw(amountLabel, right - amountW, y, { bold: true, size: 10 });
  y -= 36;

  const totalTtc = input.amountTtc ?? input.amountHt;
  const boxX = right - 220;
  const row = (label: string, value: string, opts?: { bold?: boolean; color?: typeof INK; size?: number }) => {
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

  row("Total HT", formatEuro(input.amountHt));
  draw("TVA non applicable", boxX, y, { size: 9, color: MUTED });
  draw("art. 261.4.4°a CGI", right - 110, y, { size: 9, color: MUTED });
  y -= 10;
  page.drawLine({
    start: { x: boxX, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 18;
  row("Total TTC", formatEuro(totalTtc), { bold: true, color: YELLOW, size: 12 });

  const acompte = input.acompteAmount ?? 0;
  const isPaid = input.status === "paid";
  if (acompte > 0) {
    const acompteLabel = input.acompteDate
      ? `Acompte reçu le ${formatFr(input.acompteDate)}`
      : "Acompte reçu";
    row(acompteLabel, `- ${formatEuro(acompte)}`, { color: GREEN, size: 9 });
    const solde = Math.max(totalTtc - acompte, 0);
    if (isPaid) {
      row("Solde réglé", `- ${formatEuro(solde)}`, { color: GREEN, size: 9 });
      row("Net à payer", formatEuro(0), { bold: true, color: GREEN, size: 12 });
    } else {
      row("Solde à payer", formatEuro(solde), { bold: true, size: 12 });
    }
  } else if (isPaid) {
    row("Net à payer", formatEuro(0), { bold: true, color: GREEN, size: 12 });
  }

  if (isPaid) {
    const stampBytes = await loadPublicAssetBytes(
      INVOICE_PAID_STAMP_PUBLIC_PATH,
      input.paidStampPngBytes
    );
    if (stampBytes?.byteLength) {
      try {
        const stamp = await doc.embedPng(stampBytes);
        const w = 120;
        const h = (stamp.height / stamp.width) * w;
        page.drawImage(stamp, {
          x: PAGE_W / 2 - w / 2,
          y: 280,
          width: w,
          height: h,
          opacity: 0.35,
        });
      } catch {
        /* stamp optionnel */
      }
    }
  }

  y = Math.min(y - 24, 220);
  page.drawLine({
    start: { x: left, y: y + 12 },
    end: { x: right, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  if (isPaid) {
    draw("RÈGLEMENT", left, y, { size: 8, color: MUTED, bold: true });
    draw("Facture acquittée", left, y - 14, {
      bold: true,
      size: 11,
      color: GREEN,
    });
    if (input.paymentDate) {
      draw(`Date : ${formatFr(input.paymentDate)}`, left, y - 28, { size: 9 });
    }
    if (input.paymentMethodLabel) {
      draw(`Moyen : ${input.paymentMethodLabel}`, left, y - 40, { size: 9 });
    }
  } else {
    draw("COORDONNÉES BANCAIRES", left, y, { size: 8, color: MUTED, bold: true });
    draw(`IBAN: ${FLI.iban}`, left, y - 14, { size: 9 });
    draw(`BIC: ${FLI.bic}`, left, y - 28, { size: 9 });
  }
  draw(`SIRET: ${FLI.siret}`, right - 160, y - 14, { size: 9, color: MUTED });

  const footer = [
    "France Langues International - organisme de formation",
    "SARL au capital de 5000 euros — 25 avenue de la gare, 73800 Montmélian",
    `Siret : ${FLI.siret} - RCS Chambéry - NAF : 8559A — Organisme n° ${FLI.activity}`,
    "Version 5 du 10 janvier 2026",
  ];
  let fy = 70;
  for (const line of footer) {
    const w = font.widthOfTextAtSize(line, 7);
    draw(line, (PAGE_W - w) / 2, fy, { size: 7, color: MUTED });
    fy -= 10;
  }

  return doc.save();
}

export async function buildInvoicePdfBlob(
  input: InvoicePdfInput
): Promise<Blob> {
  const bytes = await buildInvoicePdfBytes(input);
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
