/**
 * Rendu pdf-lib des PDF Convention / Programme (dossier inscription).
 * Aligné sur src/lib/inscription-documents-pdf-render.ts.
 *
 * En-tête (logo FLI) et pied de page (mentions FLI) sur **toutes** les pages.
 */

import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import type { InscriptionDocumentPdfModel } from "./inscription-documents-pdf-model.ts";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
/** Zone réservée à l'en-tête (logo + filet). */
const HEADER_HEIGHT = 64;
/** Zone réservée au pied (mentions FLI + n° de page). */
const FOOTER_HEIGHT = 56;
const CONTENT_TOP = PAGE.height - HEADER_HEIGHT - 12;
const CONTENT_BOTTOM = FOOTER_HEIGHT + 10;

const NAVY = rgb(0.07, 0.18, 0.38);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.75, 0.78, 0.82);

/** Largeur max du cachet + signature organisme sur la convention. */
const ORGANISM_SIGNATURE_MAX_WIDTH = 220;

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

export type RenderInscriptionDocumentOptions = {
  /** PNG cachet + signature manuscrite (Paula) pour le bloc organisme. */
  organismSignaturePng?: Uint8Array | null;
  /** PNG papier à en-tête FLI (logo) — dessinés sur chaque page. */
  letterheadPng?: Uint8Array | null;
};

function pdfSafe(text: string): string {
  return text
    .replace(/\u2192/g, "->")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u00B7/g, "·");
}

export function wrapText(
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
  const pushChunked = (word: string) => {
    let chunk = "";
    for (const ch of word) {
      const next = chunk + ch;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) chunk = next;
      else {
        if (chunk) lines.push(chunk);
        chunk = ch;
      }
    }
    current = chunk;
  };
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) current = word;
      else pushChunked(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawFitted(
  page: PDFPage,
  image: PDFImage,
  box: { x: number; y: number; width: number; height: number }
) {
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = box.x + (box.width - width) / 2;
  const y = box.y + (box.height - height) / 2;
  page.drawImage(image, { x, y, width, height });
}

/** En-tête FLI (logo) — répété sur chaque page. */
function drawPageHeader(
  page: PDFPage,
  fonts: Fonts,
  letterhead: PDFImage | null,
  orgName: string
) {
  page.drawRectangle({
    x: 0,
    y: PAGE.height - 6,
    width: PAGE.width,
    height: 6,
    color: NAVY,
  });

  const bandY = PAGE.height - HEADER_HEIGHT;
  const bandH = HEADER_HEIGHT - 10;

  if (letterhead) {
    drawFitted(page, letterhead, {
      x: MARGIN,
      y: bandY,
      width: PAGE.width - MARGIN * 2,
      height: bandH,
    });
  } else {
    page.drawText(pdfSafe(orgName || "France Langues International"), {
      x: MARGIN,
      y: bandY + bandH / 2 - 6,
      size: 14,
      font: fonts.bold,
      color: NAVY,
    });
  }

  page.drawLine({
    start: { x: MARGIN, y: bandY - 2 },
    end: { x: PAGE.width - MARGIN, y: bandY - 2 },
    thickness: 0.6,
    color: RULE,
  });
}

/** Pied de page FLI — répété sur chaque page. */
function drawPageFooter(
  page: PDFPage,
  fonts: Fonts,
  footerLines: string[],
  pageIndex: number,
  pageCount: number
) {
  page.drawLine({
    start: { x: MARGIN, y: FOOTER_HEIGHT + 4 },
    end: { x: PAGE.width - MARGIN, y: FOOTER_HEIGHT + 4 },
    thickness: 0.5,
    color: RULE,
  });

  const pageLabel = `Page ${pageIndex} / ${pageCount}`;
  const pageWidth = fonts.regular.widthOfTextAtSize(pageLabel, 7);
  page.drawText(pageLabel, {
    x: PAGE.width - MARGIN - pageWidth,
    y: FOOTER_HEIGHT - 8,
    size: 7,
    font: fonts.regular,
    color: MUTED,
  });

  const maxWidth = PAGE.width - MARGIN * 2 - pageWidth - 10;
  let y = FOOTER_HEIGHT - 8;
  for (const line of footerLines.slice(0, 4)) {
    const wrapped = wrapText(fonts.regular, line, 6.5, maxWidth);
    for (const w of wrapped.slice(0, 1)) {
      page.drawText(w, {
        x: MARGIN,
        y,
        size: 6.5,
        font: fonts.regular,
        color: MUTED,
      });
      y -= 8;
      if (y < 10) break;
    }
    if (y < 10) break;
  }
}

class Cursor {
  y: number;
  constructor(
    private page: PDFPage,
    private fonts: Fonts,
    private doc: PDFDocument,
    private letterhead: PDFImage | null,
    private orgName: string,
    startY: number
  ) {
    this.y = startY;
  }

  private ensure(space: number): PDFPage {
    if (this.y - space < CONTENT_BOTTOM) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      drawPageHeader(this.page, this.fonts, this.letterhead, this.orgName);
      this.y = CONTENT_TOP;
    }
    return this.page;
  }

  gap(n = 8) {
    this.y -= n;
  }

  title(text: string) {
    const page = this.ensure(40);
    const size = 16;
    const lines = wrapText(this.fonts.bold, text, size, PAGE.width - MARGIN * 2);
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.fonts.bold,
        color: NAVY,
      });
      this.y -= size + 4;
    }
    this.gap(4);
  }

  subtitle(text: string) {
    const page = this.ensure(20);
    page.drawText(pdfSafe(text), {
      x: MARGIN,
      y: this.y,
      size: 10,
      font: this.fonts.italic,
      color: MUTED,
    });
    this.y -= 16;
  }

  heading(text: string) {
    this.gap(6);
    const page = this.ensure(22);
    page.drawText(pdfSafe(text), {
      x: MARGIN,
      y: this.y,
      size: 12,
      font: this.fonts.bold,
      color: NAVY,
    });
    this.y -= 16;
    page.drawLine({
      start: { x: MARGIN, y: this.y + 8 },
      end: { x: PAGE.width - MARGIN, y: this.y + 8 },
      thickness: 0.5,
      color: RULE,
    });
  }

  kv(label: string, value: string) {
    const page = this.ensure(16);
    const labelW = 150;
    page.drawText(pdfSafe(label), {
      x: MARGIN,
      y: this.y,
      size: 10,
      font: this.fonts.bold,
      color: INK,
    });
    const lines = wrapText(
      this.fonts.regular,
      value,
      10,
      PAGE.width - MARGIN * 2 - labelW
    );
    if (lines.length === 0) {
      page.drawText("—", {
        x: MARGIN + labelW,
        y: this.y,
        size: 10,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= 14;
      return;
    }
    lines.forEach((line, i) => {
      const p = i === 0 ? page : this.ensure(14);
      p.drawText(line, {
        x: MARGIN + labelW,
        y: this.y,
        size: 10,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= 14;
    });
  }

  paragraph(text: string) {
    const lines = wrapText(
      this.fonts.regular,
      text,
      10,
      PAGE.width - MARGIN * 2
    );
    for (const line of lines) {
      const page = this.ensure(14);
      page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size: 10,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= 13;
    }
    this.gap(4);
  }

  footerNote(text: string) {
    this.gap(12);
    const page = this.ensure(30);
    const lines = wrapText(this.fonts.italic, text, 8, PAGE.width - MARGIN * 2);
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size: 8,
        font: this.fonts.italic,
        color: MUTED,
      });
      this.y -= 11;
    }
  }

  /** Dessine une image PNG en bas à gauche du curseur ; avance `y`. */
  async drawPng(bytes: Uint8Array, maxWidth: number): Promise<void> {
    const image = await this.doc.embedPng(bytes);
    const scale = Math.min(1, maxWidth / image.width);
    const width = image.width * scale;
    const height = image.height * scale;
    const page = this.ensure(height + 8);
    page.drawImage(image, {
      x: MARGIN,
      y: this.y - height,
      width,
      height,
    });
    this.y -= height + 8;
  }
}

export async function renderInscriptionDocumentPdf(
  model: InscriptionDocumentPdfModel,
  options: RenderInscriptionDocumentOptions = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  let letterhead: PDFImage | null = null;
  if (options.letterheadPng?.length) {
    try {
      letterhead = await doc.embedPng(options.letterheadPng);
    } catch {
      letterhead = null;
    }
  }

  const orgName = model.organization.legal_name || "France Langues International";
  const footerLines = model.documentFooterLines ?? [];

  const first = doc.addPage([PAGE.width, PAGE.height]);
  drawPageHeader(first, fonts, letterhead, orgName);
  const cursor = new Cursor(first, fonts, doc, letterhead, orgName, CONTENT_TOP);

  cursor.title(model.title);
  cursor.subtitle(`Document généré le ${model.generatedAtLabel}`);
  cursor.gap(8);

  cursor.heading("Stagiaire");
  if (model.studentCivility) cursor.kv("Civilité", model.studentCivility);
  cursor.kv("Nom", model.studentDisplayName);
  if (model.studentCompany) cursor.kv("Entreprise", model.studentCompany);
  if (model.studentAddressLines.length) {
    cursor.kv("Adresse", model.studentAddressLines.join(", "));
  }
  if (model.studentEmail) cursor.kv("Email", model.studentEmail);
  if (model.studentPhone) cursor.kv("Téléphone", model.studentPhone);

  cursor.heading("Formation");
  cursor.kv("Code inscription", model.inscriptionCode);
  cursor.kv("Langue", model.language);
  cursor.kv("Dates", model.datesLabel || `${model.startDateLabel} → ${model.endDateLabel}`);
  cursor.kv("Durée", model.durationHoursLabel);
  cursor.kv("Lieu", model.locationLabel);
  cursor.kv("Modalité", model.modalityLabel);
  cursor.kv("Effectif", model.groupSizeLabel);

  if (model.kind === "convention") {
    cursor.heading("Conditions financières");
    cursor.kv("Coût pédagogique", model.priceLabel);
    if (!model.hideDepositFee) {
      cursor.kv("Acompte", model.depositLabel);
    }
    cursor.kv(model.balanceRowLabel || "Solde", model.balanceLabel);
    if (model.schoolCoverageLabel) {
      cursor.kv("Prise en charge ESF", model.schoolCoverageLabel);
    }
    cursor.kv("Financement", model.fundingLabel);
    if (model.paymentTermsLabel) {
      cursor.gap(4);
      cursor.paragraph(model.paymentTermsLabel);
    }
  }

  for (const section of model.sections) {
    cursor.heading(section.title);
    for (const p of section.paragraphs) {
      cursor.paragraph(p);
    }
  }

  if (model.kind === "convention") {
    if (model.onlineSignatureBlock) {
      cursor.gap(8);
      cursor.paragraph(
        `Fait à ${model.organization.city || "Montmélian"}, en double exemplaire le ${model.generatedAtLabel}.`
      );
      cursor.gap(12);
      cursor.kv(
        "Pour l'entreprise, le stagiaire",
        "(Cachet + Nom + signature) — Bon pour Accord"
      );
      cursor.kv("Le stagiaire", model.studentDisplayName);
      cursor.gap(10);
      cursor.paragraph("Signature stagiaire : ____________________");
      cursor.gap(16);
      cursor.kv(
        "Pour l'Organisme de Formation",
        model.organization.legal_name || "France Langues International"
      );
      cursor.kv(
        "Représenté par",
        model.organization.representative || "Paula Rangel-Halbwachs"
      );
      cursor.gap(8);
      if (options.organismSignaturePng?.length) {
        await cursor.drawPng(
          options.organismSignaturePng,
          ORGANISM_SIGNATURE_MAX_WIDTH
        );
      } else {
        cursor.paragraph("Signature organisme : ____________________");
      }
    } else {
      cursor.heading("Signatures");
      cursor.paragraph(
        `Fait à ${model.organization.city || "Montmélian"}, le ${model.generatedAtLabel}.`
      );
      cursor.gap(8);
      cursor.kv(
        "Pour l'organisme",
        model.organization.representative
          ? model.organization.representative
          : model.organization.legal_name || "FLI"
      );
      cursor.kv("Le stagiaire", model.studentDisplayName);
      cursor.gap(28);
      cursor.paragraph("Signature : ____________________");
      cursor.gap(20);
      if (options.organismSignaturePng?.length) {
        await cursor.drawPng(
          options.organismSignaturePng,
          ORGANISM_SIGNATURE_MAX_WIDTH
        );
      } else {
        cursor.paragraph("Signature : ____________________");
      }
    }
  }

  cursor.footerNote(model.footerNote);

  const pages = doc.getPages();
  pages.forEach((page, i) => {
    drawPageFooter(page, fonts, footerLines, i + 1, pages.length);
  });

  return doc.save();
}
