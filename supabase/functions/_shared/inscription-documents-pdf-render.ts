/**
 * Rendu pdf-lib des PDF Convention / Programme (dossier inscription).
 * Aligné sur src/lib/inscription-documents-pdf-render.ts.
 */

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import type { InscriptionDocumentPdfModel } from "./inscription-documents-pdf-model.ts";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const NAVY = rgb(0.07, 0.18, 0.38);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.75, 0.78, 0.82);

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

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

class Cursor {
  y: number;
  constructor(
    private page: PDFPage,
    private fonts: Fonts,
    private doc: PDFDocument,
    startY: number
  ) {
    this.y = startY;
  }

  private ensure(space: number): PDFPage {
    if (this.y - space < MARGIN + 36) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      this.y = PAGE.height - MARGIN;
      drawPageChrome(this.page);
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

  legalFooter(lines: string[]) {
    if (!lines.length) return;
    this.gap(16);
    const page = this.ensure(12 + lines.length * 11);
    page.drawLine({
      start: { x: MARGIN, y: this.y + 6 },
      end: { x: PAGE.width - MARGIN, y: this.y + 6 },
      thickness: 0.5,
      color: RULE,
    });
    this.y -= 6;
    for (const line of lines) {
      const wrapped = wrapText(this.fonts.regular, line, 8, PAGE.width - MARGIN * 2);
      for (const w of wrapped) {
        const p = this.ensure(11);
        p.drawText(w, {
          x: MARGIN,
          y: this.y,
          size: 8,
          font: this.fonts.regular,
          color: MUTED,
        });
        this.y -= 11;
      }
    }
  }
}

function drawPageChrome(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: PAGE.height - 8,
    width: PAGE.width,
    height: 8,
    color: NAVY,
  });
}

export async function renderInscriptionDocumentPdf(
  model: InscriptionDocumentPdfModel
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const first = doc.addPage([PAGE.width, PAGE.height]);
  drawPageChrome(first);
  const cursor = new Cursor(first, fonts, doc, PAGE.height - MARGIN - 8);

  cursor.title(model.title);
  cursor.subtitle(
    `${model.organization.legal_name || "France Langues International"} — ${model.generatedAtLabel}`
  );
  if (model.organizationAddress) {
    cursor.subtitle(model.organizationAddress);
  }
  for (const legal of model.organizationLegalLines) {
    cursor.subtitle(legal);
  }
  cursor.gap(8);

  cursor.heading("Stagiaire");
  if (model.studentCivility) cursor.kv("Civilité", model.studentCivility);
  cursor.kv("Nom", model.studentDisplayName);
  if (model.studentAddressLines.length) {
    cursor.kv("Adresse", model.studentAddressLines.join(", "));
  }

  cursor.heading("Formation");
  cursor.kv("Code inscription", model.inscriptionCode);
  cursor.kv("Langue", model.language);
  cursor.kv("Du", model.startDateLabel);
  cursor.kv("Au", model.endDateLabel);
  cursor.kv("Durée", model.durationHoursLabel);
  cursor.kv("Lieu", model.locationLabel);
  cursor.kv("Modalité", model.modalityLabel);
  cursor.kv("Effectif", model.groupSizeLabel);

  if (model.kind === "convention") {
    cursor.heading("Conditions financières");
    cursor.kv("Coût pédagogique", model.priceLabel);
    cursor.kv("Acompte", model.depositLabel);
    cursor.kv("Solde", model.balanceLabel);
    cursor.kv("Financement", model.fundingLabel);
  }

  for (const section of model.sections) {
    cursor.heading(section.title);
    for (const p of section.paragraphs) {
      cursor.paragraph(p);
    }
  }

  if (model.kind === "convention") {
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
    cursor.paragraph("Signature : ____________________");
  }

  cursor.footerNote(model.footerNote);
  cursor.legalFooter(model.documentFooterLines ?? []);

  return doc.save();
}
