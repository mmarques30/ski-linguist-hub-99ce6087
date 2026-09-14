/**
 * Rendu PDF (pdf-lib) des trois habillages C.5.
 * Prix, saison, barème et identité viennent du modèle — jamais d'année ni de
 * montant écrits en dur dans le rendu.
 */

import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import type { EvaluationPdfAssets } from "./evaluation-pdf-assets.ts";
import {
  ESF_COURSE_HEADING,
  ESF_COURSE_TABLE,
  ESF_DIRECTOR_NOTE,
  ESF_ORGANISMES_CAPTION,
  ESF_REGIONAL_SECTIONS,
  ESF_RETEST_NOTE,
  formatNiveauTableLabel,
  type EvaluationPdfModel,
} from "./evaluation-pdf-model.ts";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 42;
const NAVY = rgb(0.07, 0.18, 0.38);
const TEAL = rgb(0.05, 0.32, 0.4);
const GOLD = rgb(0.85, 0.58, 0.08);
const MAGENTA = rgb(0.89, 0.08, 0.42);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.75, 0.78, 0.82);
const BAND = rgb(0.93, 0.95, 0.97);

export type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

function pdfSafe(text: string): string {
  return text
    .replace(/\u2192/g, "->")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00A0/g, " ");
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

function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e;
}

async function embedImage(doc: PDFDocument, bytes?: Uint8Array): Promise<PDFImage | null> {
  if (!bytes?.byteLength) return null;
  try {
    return isPng(bytes) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  } catch {
    return null;
  }
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

type Bounds = { left: number; right: number; top: number; bottom: number };

class Cursor {
  page: PDFPage;
  y: number;
  bounds: Bounds;

  constructor(
    private doc: PDFDocument,
    private fonts: Fonts,
    bounds: Bounds,
    start?: PDFPage,
    private onPage?: (page: PDFPage) => void
  ) {
    this.bounds = bounds;
    this.page = start ?? this.doc.addPage([PAGE.width, PAGE.height]);
    this.onPage?.(this.page);
    this.y = this.bounds.top;
  }

  get width() {
    return this.bounds.right - this.bounds.left;
  }

  setBottom(bottom: number) {
    this.bounds = { ...this.bounds, bottom };
  }

  ensure(needed: number) {
    if (this.y - needed < this.bounds.bottom) {
      this.page = this.doc.addPage([PAGE.width, PAGE.height]);
      this.onPage?.(this.page);
      this.y = this.bounds.top;
    }
  }

  forceNewPage() {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.onPage?.(this.page);
    this.y = this.bounds.top;
  }

  text(
    value: string,
    opts: {
      size?: number;
      bold?: boolean;
      italic?: boolean;
      color?: ReturnType<typeof rgb>;
      x?: number;
      maxWidth?: number;
      gap?: number;
    } = {}
  ) {
    const size = opts.size ?? 10;
    const font = opts.italic
      ? this.fonts.italic
      : opts.bold
        ? this.fonts.bold
        : this.fonts.regular;
    const color = opts.color ?? INK;
    const x = opts.x ?? this.bounds.left;
    const maxWidth = opts.maxWidth ?? this.bounds.right - x;
    const lines = wrapText(font, value, size, maxWidth);
    const gap = opts.gap ?? 3;
    for (const line of lines) {
      this.ensure(size + gap);
      this.page.drawText(line, { x, y: this.y - size, size, font, color });
      this.y -= size + gap;
    }
    if (lines.length === 0) this.y -= size * 0.35;
  }

  space(px = 8) {
    this.y -= px;
  }

  rule() {
    this.ensure(10);
    this.page.drawLine({
      start: { x: this.bounds.left, y: this.y },
      end: { x: this.bounds.right, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 10;
  }

  kv(label: string, value: string) {
    const labelSize = 9;
    const valueSize = 10;
    const labelFont = this.fonts.bold;
    const valueFont = this.fonts.regular;
    const safeLabel = pdfSafe(label);
    const labelWidth = Math.min(
      labelFont.widthOfTextAtSize(safeLabel, labelSize),
      this.width * 0.42
    );
    const valueX = this.bounds.left + labelWidth + 8;
    const valueWidth = this.bounds.right - valueX;
    const lines = wrapText(valueFont, value, valueSize, valueWidth);
    const lineCount = Math.max(1, lines.length);
    const rowH = lineCount * (valueSize + 2) + 4;
    this.ensure(rowH);
    this.page.drawText(safeLabel, {
      x: this.bounds.left,
      y: this.y - valueSize,
      size: labelSize,
      font: labelFont,
      color: MUTED,
    });
    lines.forEach((line, i) => {
      this.page.drawText(line, {
        x: valueX,
        y: this.y - valueSize - i * (valueSize + 2),
        size: valueSize,
        font: valueFont,
        color: INK,
      });
    });
    this.y -= rowH;
  }
}

function drawTable(
  cursor: Cursor,
  fonts: Fonts,
  rows: string[][],
  colWidths: number[],
  header = false,
  size = 7.5
) {
  const pad = 3.5;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const wrapped = row.map((cell, ci) =>
      wrapText(
        i === 0 && header ? fonts.bold : fonts.regular,
        cell,
        size,
        colWidths[ci] - pad * 2
      )
    );
    const lineCount = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = lineCount * (size + 2) + pad * 2;
    cursor.ensure(rowH);
    let x = cursor.bounds.left;
    if (i === 0 && header) {
      cursor.page.drawRectangle({
        x: cursor.bounds.left,
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

function drawDsfChrome(page: PDFPage, letterhead: PDFImage | null) {
  if (letterhead) {
    page.drawImage(letterhead, {
      x: 0,
      y: 0,
      width: PAGE.width,
      height: PAGE.height,
    });
  }
}

function drawPartnerBand(
  page: PDFPage,
  fonts: Fonts,
  logos: PDFImage[],
  left: number,
  right: number
) {
  const captionY = 92;
  page.drawText(ESF_ORGANISMES_CAPTION, {
    x: left,
    y: captionY,
    size: 8,
    font: fonts.bold,
    color: NAVY,
  });
  const bandY = 28;
  const bandH = 58;
  const gap = 6;
  const count = Math.max(1, logos.length);
  const boxW = (right - left - gap * (count - 1)) / count;
  logos.forEach((logo, i) => {
    drawFitted(page, logo, {
      x: left + i * (boxW + gap),
      y: bandY,
      width: boxW,
      height: bandH,
    });
  });
}

function drawFooter(
  page: PDFPage,
  fonts: Fonts,
  model: EvaluationPdfModel,
  index: number,
  total: number,
  bounds: Bounds
) {
  const pageLabel = `Page ${index} / ${total}`;
  const pageWidth = fonts.regular.widthOfTextAtSize(pageLabel, 8);
  if (model.showFliHeaderFooter) {
    const maxWidth = bounds.right - bounds.left - pageWidth - 12;
    const lines = wrapText(fonts.regular, model.identityLine, 7, maxWidth);
    let y = 22 + Math.max(0, lines.length - 1) * 8;
    for (const line of lines) {
      page.drawText(line, {
        x: bounds.left,
        y,
        size: 7,
        font: fonts.regular,
        color: MUTED,
      });
      y -= 8;
    }
  }
  page.drawText(pageLabel, {
    x: PAGE.width - MARGIN - pageWidth,
    y: 18,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
}

function drawSkillsTable(cursor: Cursor, fonts: Fonts, model: EvaluationPdfModel, accent: ReturnType<typeof rgb>) {
  cursor.text("Niveau de 0 à 5 et équivalence CECRL", {
    size: 11,
    bold: true,
    color: accent,
  });
  cursor.space(4);
  drawTable(
    cursor,
    fonts,
    [
      ["Compétence évaluée", "Niveau"],
      ...model.skillRows.map((row) => [row.label, row.value]),
    ],
    [cursor.width * 0.68, cursor.width * 0.32],
    true
  );
  cursor.space(6);
}

function drawBaremeTable(
  cursor: Cursor,
  fonts: Fonts,
  model: EvaluationPdfModel,
  accent: ReturnType<typeof rgb>,
  compact = false
) {
  cursor.text("Barème européen", {
    size: compact ? 8 : 11,
    bold: true,
    color: accent,
  });
  cursor.space(compact ? 2 : 3);
  drawTable(
    cursor,
    fonts,
    [
      ["CECRL", "Niveau", "Libellés"],
      ...model.baremeRows.map((row) => [
        row.cecrl,
        formatNiveauTableLabel(row.niveau),
        row.labels,
      ]),
    ],
    [cursor.width * 0.14, cursor.width * 0.28, cursor.width * 0.58],
    true,
    compact ? 6 : 7.5
  );
  cursor.space(compact ? 3 : 5);
}

function drawSkillsAndBareme(cursor: Cursor, fonts: Fonts, model: EvaluationPdfModel) {
  const accent = model.showDsfLetterhead ? MAGENTA : model.showFliHeaderFooter ? GOLD : NAVY;
  drawSkillsTable(cursor, fonts, model, accent);
  drawBaremeTable(cursor, fonts, model, accent);
}

function drawMeta(cursor: Cursor, model: EvaluationPdfModel) {
  cursor.kv("Nom – Prénom :", model.candidateDisplayName);
  if (model.showCompanyField) {
    cursor.kv("Entreprise :", model.companyName);
  } else {
    cursor.kv(model.habillage === "esf" ? "ESF :" : "École de ski :", model.skiSchoolName);
  }
  if (model.showSyndicateHeader) {
    cursor.kv("N° Carte Syndicale :", model.carteSyndicale);
    cursor.kv("Discipline :", model.skiDisciplineLabel);
    cursor.kv("Cycle de formation :", model.trainingCycle);
  }
  cursor.kv("Langue évaluée :", model.languageLabel);
  cursor.kv("Avez-vous déjà été évalué(e) ?", model.previousTestLabel);
  cursor.kv("Date de l'évaluation :", model.evaluatedOn);
  cursor.kv("Nom de l'évaluateur / formateur :", model.instructorName);
  cursor.kv("Profession :", model.candidateProfession);
  cursor.space(4);
}

function drawComments(cursor: Cursor, model: EvaluationPdfModel, accent: ReturnType<typeof rgb>) {
  const compact = model.showDsfLetterhead;
  cursor.text(
    model.habillage === "dsf"
      ? "Appréciation"
      : "Appréciation sur les capacités du stagiaire",
    { size: compact ? 10 : 11, bold: true, color: accent }
  );
  cursor.space(compact ? 2 : 4);
  for (const bloc of model.blocs) {
    cursor.text(bloc.label, { size: compact ? 8 : 9, bold: true, color: MUTED });
    cursor.text(bloc.text || "—", { size: compact ? 8 : 9.5 });
    cursor.space(compact ? 2 : 3);
  }
}

export async function renderEvaluationPdf(
  model: EvaluationPdfModel,
  assets: EvaluationPdfAssets = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const esfLogo = await embedImage(doc, assets.esfLogo);
  const fliHeader = await embedImage(doc, assets.fliHeader);
  const fliCachet = await embedImage(doc, assets.fliCachet);
  const dsfLetterhead = await embedImage(doc, assets.dsfLetterhead);
  const partnerLogos: PDFImage[] = [];
  for (const bytes of assets.partnerLogos ?? []) {
    const img = await embedImage(doc, bytes);
    if (img) partnerLogos.push(img);
  }

  const accent = model.showDsfLetterhead
    ? MAGENTA
    : model.showFliHeaderFooter
      ? TEAL
      : NAVY;

  const bounds: Bounds = model.showDsfLetterhead
    ? { left: 50, right: PAGE.width - 50, top: PAGE.height - 152, bottom: 130 }
    : model.showFliHeaderFooter
      ? { left: MARGIN, right: PAGE.width - MARGIN, top: PAGE.height - MARGIN, bottom: 48 }
      : { left: MARGIN, right: PAGE.width - MARGIN, top: PAGE.height - MARGIN, bottom: 108 };

  const onPage = (page: PDFPage) => {
    if (model.showDsfLetterhead) drawDsfChrome(page, dsfLetterhead);
  };

  const cursor = new Cursor(doc, fonts, bounds, undefined, onPage);
  const firstPage = cursor.page;

  if (model.showSyndicateHeader) {
    const logoSize = 62;
    if (esfLogo) {
      cursor.page.drawImage(esfLogo, {
        x: cursor.bounds.left,
        y: cursor.y - logoSize,
        width: logoSize,
        height: logoSize,
      });
    }
    const titleX = cursor.bounds.left + (esfLogo ? logoSize + 12 : 0);
    const titleWidth = cursor.bounds.right - titleX;
    const titleLines = wrapText(fonts.bold, model.title, 13, titleWidth);
    let ty = cursor.y - 16;
    for (const line of titleLines) {
      cursor.page.drawText(line, {
        x: titleX,
        y: ty,
        size: 13,
        font: fonts.bold,
        color: NAVY,
      });
      ty -= 16;
    }
    cursor.y -= Math.max(logoSize, titleLines.length * 16) + 8;
  } else if (model.showFliHeaderFooter && fliHeader) {
    const headerH = 58;
    cursor.page.drawRectangle({
      x: cursor.bounds.left,
      y: cursor.y - headerH,
      width: cursor.width,
      height: headerH,
      color: rgb(0, 0, 0),
    });
    drawFitted(cursor.page, fliHeader, {
      x: cursor.bounds.left + 8,
      y: cursor.y - headerH + 4,
      width: cursor.width - 16,
      height: headerH - 8,
    });
    cursor.y -= headerH + 8;
    cursor.text(model.title, { size: 12, bold: true, color: TEAL });
    cursor.space(3);
  } else {
    cursor.text(model.title, { size: 14, bold: true, color: accent });
    cursor.space(4);
  }

  cursor.text(model.subtitle, { size: 9, bold: true, color: INK, gap: 2 });
  if (model.noteMethodologique) {
    cursor.text(model.noteMethodologique, {
      size: 8,
      italic: true,
      color: MUTED,
      gap: 2,
    });
  }
  cursor.space(4);
  cursor.rule();
  drawMeta(cursor, model);

  if (model.habillage === "esf") {
    const accentNavy = NAVY;
    cursor.text("Niveau de 0 à 5 et équivalence CECRL", {
      size: 11,
      bold: true,
      color: accentNavy,
    });
    cursor.space(4);
    drawTable(
      cursor,
      fonts,
      [
        ["Compétence évaluée", "Niveau"],
        ...model.skillRows.map((row) => [row.label, row.value]),
      ],
      [cursor.width * 0.68, cursor.width * 0.32],
      true
    );
    cursor.space(6);
    if (model.showPrice && model.priceLabel) {
      cursor.text(`Tarif ${model.priceLabel}`, { size: 11, bold: true, color: TEAL });
      cursor.space(4);
    }
    drawComments(cursor, model, accentNavy);
    cursor.space(4);
    cursor.text("T.S.V.P.", { size: 9, bold: true });
    if (partnerLogos.length) {
      drawPartnerBand(
        firstPage,
        fonts,
        partnerLogos,
        cursor.bounds.left,
        cursor.bounds.right
      );
    }

    cursor.setBottom(MARGIN + 28);
    cursor.forceNewPage();
    if (esfLogo) {
      const logoSize = 36;
      cursor.page.drawImage(esfLogo, {
        x: cursor.bounds.left,
        y: cursor.y - logoSize,
        width: logoSize,
        height: logoSize,
      });
      cursor.text(model.title, {
        size: 11,
        bold: true,
        color: NAVY,
        x: cursor.bounds.left + logoSize + 8,
        maxWidth: cursor.width - logoSize - 8,
      });
      cursor.y = Math.min(cursor.y, cursor.bounds.top - logoSize - 8);
    } else {
      cursor.text(model.title, { size: 11, bold: true, color: NAVY });
    }
    cursor.space(6);
    cursor.text("Barème européen", { size: 11, bold: true, color: NAVY });
    cursor.space(3);
    drawTable(
      cursor,
      fonts,
      [
        ["CECRL", "Niveau", "Libellés"],
        ...model.baremeRows.map((row) => [
          row.cecrl,
          formatNiveauTableLabel(row.niveau),
          row.labels,
        ]),
      ],
      [cursor.width * 0.14, cursor.width * 0.28, cursor.width * 0.58],
      true
    );
    cursor.space(8);
    cursor.text(ESF_DIRECTOR_NOTE, { size: 8.5, color: MUTED });
    cursor.space(4);
    cursor.text(ESF_COURSE_HEADING, { size: 10, bold: true });
    cursor.space(3);
    drawTable(
      cursor,
      fonts,
      [
        ["Type de cours", "Niveau d'anglais requis"],
        ...ESF_COURSE_TABLE.map((row) => [row.course, row.level]),
      ],
      [cursor.width * 0.72, cursor.width * 0.28],
      true
    );
    cursor.space(6);
    cursor.text(ESF_RETEST_NOTE, { size: 8.5, color: MUTED });
    cursor.space(8);
    cursor.text("Sections régionales", { size: 11, bold: true, color: NAVY });
    cursor.space(3);
    for (const section of ESF_REGIONAL_SECTIONS) {
      cursor.text(`${section.phone} – ${section.places}`, { size: 8.5 });
    }
  } else if (model.showDsfLetterhead) {
    drawSkillsTable(cursor, fonts, model, accent);
    drawBaremeTable(cursor, fonts, model, accent, true);
    drawComments(cursor, model, accent);
  } else {
    drawSkillsAndBareme(cursor, fonts, model);
    if (model.showPrice && model.priceLabel) {
      cursor.text(`Tarif ${model.priceLabel}`, {
        size: 11,
        bold: true,
        color: model.showFliHeaderFooter ? TEAL : accent,
      });
      cursor.space(4);
    }
    drawComments(cursor, model, accent);
    if (model.showFliHeaderFooter) {
      const stampW = 120;
      const stampH = 58;
      if (fliCachet) {
        drawFitted(cursor.page, fliCachet, {
          x: cursor.bounds.right - stampW,
          y: Math.max(cursor.bounds.bottom + 2, cursor.y - stampH),
          width: stampW,
          height: stampH,
        });
      }
      cursor.text(`Fait à ${model.identity.city}, le ${model.verifiedOn ?? "—"}`, {
        size: 9,
        maxWidth: cursor.width - (fliCachet ? stampW + 8 : 0),
      });
    }
  }

  const pages = doc.getPages();
  const footerBounds: Bounds = model.showDsfLetterhead
    ? bounds
    : { left: MARGIN, right: PAGE.width - MARGIN, top: PAGE.height - MARGIN, bottom: 28 };
  pages.forEach((page, i) => {
    if (model.habillage === "esf" && i === 0 && partnerLogos.length) {
      // bande déjà posée en pied de première page
    }
    if (model.showDsfLetterhead) return;
    drawFooter(page, fonts, model, i + 1, pages.length, footerBounds);
  });

  return doc.save();
}
