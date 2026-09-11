/**
 * Rendu PDF (pdf-lib) des trois habillages C.5.
 * Le prix n'est jamais écrit en dur : il vient du modèle (app_settings).
 */

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import {
  CECRL_BAREME,
  ESF_COURSE_TABLE,
  ESF_DIRECTOR_NOTE,
  ESF_REGIONAL_SECTIONS,
  ESF_RETEST_NOTE,
  type EvaluationPdfModel,
} from "./evaluation-pdf";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 42;
const NAVY = rgb(0.07, 0.18, 0.38);
const TEAL = rgb(0.05, 0.32, 0.4);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.75, 0.78, 0.82);
const BAND = rgb(0.93, 0.95, 0.97);

type Fonts = { regular: PDFFont; bold: PDFFont };

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word;
      } else {
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
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

class Cursor {
  page: PDFPage;
  y: number;
  constructor(
    private doc: PDFDocument,
    private fonts: Fonts,
    start?: PDFPage
  ) {
    this.page = start ?? this.doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN;
  }

  ensure(needed: number) {
    if (this.y - needed < MARGIN + 28) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      this.y = PAGE.height - MARGIN;
    }
  }

  text(
    value: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      x?: number;
      maxWidth?: number;
      gap?: number;
    } = {}
  ) {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const color = opts.color ?? INK;
    const x = opts.x ?? MARGIN;
    const maxWidth = opts.maxWidth ?? PAGE.width - MARGIN * 2;
    const lines = wrap(font, value, size, maxWidth);
    const gap = opts.gap ?? 3;
    for (const line of lines) {
      this.ensure(size + gap);
      this.page.drawText(line, { x, y: this.y - size, size, font, color });
      this.y -= size + gap;
    }
    if (lines.length === 0) this.y -= size * 0.4;
  }

  space(px = 8) {
    this.y -= px;
  }

  rule() {
    this.ensure(10);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.width - MARGIN, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 10;
  }

  kv(label: string, value: string) {
    this.ensure(16);
    this.page.drawText(label, {
      x: MARGIN,
      y: this.y - 10,
      size: 9,
      font: this.fonts.bold,
      color: MUTED,
    });
    const labelWidth = this.fonts.bold.widthOfTextAtSize(label, 9);
    this.page.drawText(value, {
      x: MARGIN + labelWidth + 6,
      y: this.y - 10,
      size: 10,
      font: this.fonts.regular,
      color: INK,
    });
    this.y -= 16;
  }
}

function drawTable(
  cursor: Cursor,
  fonts: Fonts,
  rows: string[][],
  colWidths: number[],
  header = false
) {
  const size = 8.5;
  const pad = 5;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const wrapped = row.map((cell, ci) =>
      wrap(i === 0 && header ? fonts.bold : fonts.regular, cell, size, colWidths[ci] - pad * 2)
    );
    const lineCount = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = lineCount * (size + 2) + pad * 2;
    cursor.ensure(rowH);
    let x = MARGIN;
    if (i === 0 && header) {
      cursor.page.drawRectangle({
        x: MARGIN,
        y: cursor.y - rowH,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: rowH,
        color: BAND,
      });
    }
    for (let ci = 0; ci < row.length; ci++) {
      cursor.page.drawRectangle({
        x,
        y: cursor.y - rowH,
        width: colWidths[ci],
        height: rowH,
        borderWidth: 0.5,
        borderColor: RULE,
      });
      wrapped[ci].forEach((line, li) => {
        cursor.page.drawText(line, {
          x: x + pad,
          y: cursor.y - pad - size - li * (size + 2),
          size,
          font: i === 0 && header ? fonts.bold : fonts.regular,
          color: INK,
        });
      });
      x += colWidths[ci];
    }
    cursor.y -= rowH;
  }
}

function drawHeader(cursor: Cursor, model: EvaluationPdfModel) {
  if (model.showSyndicateHeader) {
    cursor.text("SNMSF / ESF", { size: 9, bold: true, color: NAVY });
    cursor.text(model.title, { size: 16, bold: true, color: NAVY });
    cursor.space(4);
    return;
  }
  if (model.showFliHeaderFooter) {
    cursor.text(model.identity.legal_name, { size: 11, bold: true, color: TEAL });
    cursor.text("EVALUATION EN LANGUE VIVANTE", { size: 14, bold: true, color: TEAL });
    cursor.text(model.yearLabel, { size: 12, bold: true, color: TEAL });
    cursor.space(2);
    cursor.text(model.title, { size: 10, color: MUTED });
    cursor.space(4);
    return;
  }
  cursor.text(model.title, { size: 16, bold: true, color: NAVY });
  cursor.space(4);
}

function drawFooter(page: PDFPage, fonts: Fonts, model: EvaluationPdfModel, index: number, total: number) {
  const y = 22;
  if (model.showFliHeaderFooter) {
    page.drawText(model.identityLine, {
      x: MARGIN,
      y: y + 8,
      size: 7,
      font: fonts.regular,
      color: MUTED,
    });
  }
  page.drawText(`Page ${index} / ${total}`, {
    x: PAGE.width - MARGIN - 60,
    y,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
}

export async function renderEvaluationPdf(model: EvaluationPdfModel): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const cursor = new Cursor(doc, fonts);
  const contentWidth = PAGE.width - MARGIN * 2;

  drawHeader(cursor, model);
  cursor.rule();

  cursor.kv("Nom – Prénom :", model.candidateName);
  if (model.showCompanyField) {
    cursor.kv("Entreprise :", model.companyName);
  } else {
    cursor.kv(model.habillage === "esf" ? "ESF :" : "École de ski :", model.skiSchoolName);
  }
  if (model.showSyndicateHeader) {
    cursor.kv("N° Carte Syndicale :", model.carteSyndicale);
  }
  cursor.kv("Langue évaluée :", model.languageLabel);
  cursor.kv("Avez-vous déjà été évalué(e) ?", model.previousTestLabel);
  cursor.kv("Date de l'évaluation :", model.evaluatedOn);
  cursor.kv("Nom de l'évaluateur / formateur :", model.instructorName);
  cursor.kv("Profession :", model.candidateProfession);
  cursor.space(6);

  cursor.text("Niveau de 0 à 5 et équivalence CECRL", {
    size: 11,
    bold: true,
    color: NAVY,
  });
  cursor.space(4);
  drawTable(
    cursor,
    fonts,
    [
      ["Compétence évaluée", "Niveau"],
      ...model.skillRows.map((row) => [row.label, row.value]),
    ],
    [contentWidth * 0.68, contentWidth * 0.32],
    true
  );
  cursor.space(8);

  cursor.text("Barème européen", { size: 11, bold: true, color: NAVY });
  cursor.space(3);
  drawTable(
    cursor,
    fonts,
    [
      ["CECRL", "Niveau", "Libellés"],
      ...CECRL_BAREME.map((row) => [row.cecrl, row.niveau, row.labels]),
    ],
    [contentWidth * 0.14, contentWidth * 0.28, contentWidth * 0.58],
    true
  );
  cursor.space(8);

  if (model.showPrice && model.priceLabel) {
    cursor.text(`Tarif ${model.priceLabel}`, { size: 11, bold: true, color: TEAL });
    cursor.space(4);
  }

  if (model.noteMethodologique) {
    cursor.text("Note méthodologique", { size: 11, bold: true, color: NAVY });
    cursor.text(model.noteMethodologique, { size: 9.5 });
    cursor.space(6);
  }

  if (model.showCourseTable) {
    cursor.text(ESF_DIRECTOR_NOTE, { size: 8.5, color: MUTED });
    cursor.text("T.S.V.P.", { size: 9, bold: true });
    cursor.space(6);
    cursor.text(
      "Corrélation entre le niveau d'anglais du moniteur ESF et le niveau du cours enseigné :",
      { size: 10, bold: true }
    );
    cursor.space(3);
    drawTable(
      cursor,
      fonts,
      [
        ["Type de cours", "Niveau d'anglais requis"],
        ...ESF_COURSE_TABLE.map((row) => [row.course, row.level]),
      ],
      [contentWidth * 0.72, contentWidth * 0.28],
      true
    );
    cursor.space(6);
    cursor.text(ESF_RETEST_NOTE, { size: 8.5, color: MUTED });
    cursor.space(8);
  }

  cursor.text(
    model.habillage === "dsf"
      ? "Appréciation"
      : "Appréciation sur les capacités du stagiaire",
    { size: 11, bold: true, color: NAVY }
  );
  cursor.space(4);
  for (const bloc of model.blocs) {
    cursor.text(bloc.label, { size: 9, bold: true, color: MUTED });
    cursor.text(bloc.text || "—", { size: 9.5 });
    cursor.space(5);
  }

  if (model.showFliHeaderFooter) {
    cursor.space(8);
    cursor.text(`Fait à ${model.identity.city}, le ${model.evaluatedOn}`, {
      size: 9,
    });
  }

  if (model.showRegionalSections) {
    cursor.space(8);
    cursor.text("Sections régionales", { size: 11, bold: true, color: NAVY });
    cursor.space(3);
    for (const section of ESF_REGIONAL_SECTIONS) {
      cursor.text(`${section.phone} – ${section.places}`, { size: 8.5 });
    }
  }

  const pages = doc.getPages();
  pages.forEach((page, i) => drawFooter(page, fonts, model, i + 1, pages.length));

  return doc.save();
}
