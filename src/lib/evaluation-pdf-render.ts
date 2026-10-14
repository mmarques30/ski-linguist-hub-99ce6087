/**
 * Rendu PDF (pdf-lib) des trois habillages C.5.
 * Habillage ESF : ordre et libellés du .dotx « Évaluation en langue vivante ».
 * Prix, saison, barème et identité viennent du modèle — jamais d'année ni de
 * montant écrits en dur dans le rendu.
 */

import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, StandardFonts } from "pdf-lib";
import type { EvaluationPdfAssets } from "./evaluation-pdf-assets";
import {
  ESF_APPRECIATION_HEADING,
  ESF_BAREME_HEADING,
  ESF_CACHET_CAPTION,
  ESF_COURSE_HEADING,
  ESF_COURSE_TABLE,
  ESF_DIRECTOR_NOTE,
  ESF_ORGANISM_NAME,
  ESF_PAGE_LABEL,
  ESF_REGIONAL_SECTIONS,
  ESF_RETEST_NOTE,
  formatNiveauTableLabel,
  type EvaluationPdfModel,
} from "./evaluation-pdf";

const PAGE = { width: 595.28, height: 841.89 };
/** Marges .dotx = 720 twips ≈ 36 pt. */
const MARGIN = 42;
const MARGIN_ESF = 36;
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
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
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
      align?: "left" | "center" | "right";
    } = {}
  ) {
    const size = opts.size ?? 10;
    const font = opts.italic
      ? this.fonts.italic
      : opts.bold
        ? this.fonts.bold
        : this.fonts.regular;
    const color = opts.color ?? INK;
    const x0 = opts.x ?? this.bounds.left;
    const maxWidth = opts.maxWidth ?? this.bounds.right - x0;
    const lines = wrapText(font, value, size, maxWidth);
    const gap = opts.gap ?? 3;
    for (const line of lines) {
      this.ensure(size + gap);
      let x = x0;
      if (opts.align === "center") {
        x = x0 + (maxWidth - font.widthOfTextAtSize(line, size)) / 2;
      } else if (opts.align === "right") {
        x = x0 + maxWidth - font.widthOfTextAtSize(line, size);
      }
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

/** Barème .dotx : une ligne d'en-tête fusionnée, puis colonnes A1→C2. */
function drawEsfBaremeHorizontal(cursor: Cursor, fonts: Fonts, model: EvaluationPdfModel) {
  const rows = model.baremeRows;
  const cols = Math.max(1, rows.length);
  const tableW = cursor.width;
  const colW = tableW / cols;
  const pad = 2.5;
  const titleSize = 9;
  const cellSize = 7;
  const titleH = titleSize + pad * 2 + 2;

  const cellLines = rows.map((row) => {
    const labels = row.labels
      .split(/\s*\/\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      cecrl: row.cecrl,
      niveau: formatNiveauTableLabel(row.niveau),
      labels,
    };
  });
  const labelLineCount = Math.max(1, ...cellLines.map((c) => c.labels.length));
  const cecrlH = cellSize + pad * 2 + 2;
  const niveauH = cellSize + pad * 2 + 2;
  const labelsH = labelLineCount * (cellSize + 1.5) + pad * 2;

  cursor.ensure(titleH + cecrlH + niveauH + labelsH);
  const x0 = cursor.bounds.left;

  cursor.page.drawRectangle({
    x: x0,
    y: cursor.y - titleH,
    width: tableW,
    height: titleH,
    borderWidth: 0.5,
    borderColor: RULE,
    color: BAND,
  });
  const title = pdfSafe(ESF_BAREME_HEADING);
  const titleWidth = fonts.bold.widthOfTextAtSize(title, titleSize);
  cursor.page.drawText(title, {
    x: x0 + (tableW - titleWidth) / 2,
    y: cursor.y - pad - titleSize,
    size: titleSize,
    font: fonts.bold,
    color: NAVY,
  });
  cursor.y -= titleH;

  const drawRow = (getText: (i: number) => string | string[], size: number, rowH: number, bold = false) => {
    let x = x0;
    for (let i = 0; i < cols; i++) {
      cursor.page.drawRectangle({
        x,
        y: cursor.y - rowH,
        width: colW,
        height: rowH,
        borderWidth: 0.5,
        borderColor: RULE,
      });
      const raw = getText(i);
      const lines = Array.isArray(raw)
        ? raw.map((l) => pdfSafe(l))
        : wrapText(bold ? fonts.bold : fonts.regular, raw, size, colW - pad * 2);
      lines.forEach((line, li) => {
        const tw = (bold ? fonts.bold : fonts.regular).widthOfTextAtSize(line, size);
        cursor.page.drawText(line, {
          x: x + Math.max(pad, (colW - tw) / 2),
          y: cursor.y - pad - size - li * (size + 1.5),
          size,
          font: bold ? fonts.bold : fonts.regular,
          color: INK,
        });
      });
      x += colW;
    }
    cursor.y -= rowH;
  };

  drawRow((i) => cellLines[i].cecrl, cellSize, cecrlH, true);
  drawRow((i) => cellLines[i].niveau, cellSize, niveauH, false);
  drawRow((i) => cellLines[i].labels, cellSize, labelsH, false);
  cursor.space(6);
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

function drawFooter(
  page: PDFPage,
  fonts: Fonts,
  model: EvaluationPdfModel,
  index: number,
  total: number,
  bounds: Bounds
) {
  const pageLabel =
    model.habillage === "esf" ? ESF_PAGE_LABEL(index, total) : `Page ${index} / ${total}`;
  const pageWidth = fonts.regular.widthOfTextAtSize(pdfSafe(pageLabel), 8);
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
  page.drawText(pdfSafe(pageLabel), {
    x: PAGE.width - (model.habillage === "esf" ? MARGIN_ESF : MARGIN) - pageWidth,
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

/** Identité page 1 du .dotx ESF (champs et ordre). */
function drawEsfMeta(
  cursor: Cursor,
  fonts: Fonts,
  model: EvaluationPdfModel,
  fliCachet: PDFImage | null
) {
  cursor.kv("Nom – Prénom :", model.candidateDisplayName);
  cursor.kv("Adresse :", "—");
  cursor.kv("ESF :", model.skiSchoolName);
  cursor.kv("N° Carte Syndicale :", model.carteSyndicale);
  cursor.kv("Langue(s) :", model.languageLabel);
  cursor.kv("Avez-vous déjà été évalué(e) ?", model.previousTestLabel);
  cursor.kv(
    "Pour quelle(s) langue(s) ?",
    model.previousTestLabel === "OUI" ? model.languageLabel : "—"
  );
  cursor.kv("A quel niveau de formation êtes-vous ?", model.skiDisciplineLabel);
  cursor.kv("Cycle de formation :", model.trainingCycle);

  const orgLabel = "Nom de l'organisme de formation :";
  const orgValue = ESF_ORGANISM_NAME;
  const stampW = 70;
  const stampH = 34;
  const labelSize = 9;
  const valueSize = 10;
  const rowH = Math.max(stampH + 4, valueSize + 8);
  cursor.ensure(rowH + 12);
  cursor.page.drawText(pdfSafe(orgLabel), {
    x: cursor.bounds.left,
    y: cursor.y - valueSize,
    size: labelSize,
    font: fonts.bold,
    color: MUTED,
  });
  const labelW = fonts.bold.widthOfTextAtSize(pdfSafe(orgLabel), labelSize);
  cursor.page.drawText(pdfSafe(orgValue), {
    x: cursor.bounds.left + labelW + 6,
    y: cursor.y - valueSize,
    size: valueSize,
    font: fonts.regular,
    color: INK,
  });
  if (fliCachet) {
    drawFitted(cursor.page, fliCachet, {
      x: cursor.bounds.right - stampW,
      y: cursor.y - stampH,
      width: stampW,
      height: stampH,
    });
    const cap = pdfSafe(ESF_CACHET_CAPTION);
    const capW = fonts.regular.widthOfTextAtSize(cap, 7);
    cursor.page.drawText(cap, {
      x: cursor.bounds.right - stampW + (stampW - capW) / 2,
      y: cursor.y - stampH - 9,
      size: 7,
      font: fonts.regular,
      color: MUTED,
    });
    cursor.y -= rowH + 10;
  } else {
    cursor.y -= rowH;
  }

  cursor.kv("Date de l'évaluation :", model.evaluatedOn);
  cursor.kv("Nom de l'évaluateur / formateur :", model.instructorName);
  cursor.space(6);
}

function drawEsfSkillsTable(cursor: Cursor, fonts: Fonts, model: EvaluationPdfModel) {
  drawTable(
    cursor,
    fonts,
    [
      ["", "Niveau de 0 à 5"],
      ...model.skillRows.map((row) => [row.label, row.value]),
    ],
    [cursor.width * 0.68, cursor.width * 0.32],
    true,
    9
  );
  cursor.space(8);
}

function drawEsfComments(cursor: Cursor, model: EvaluationPdfModel) {
  cursor.text(ESF_APPRECIATION_HEADING, { size: 11, bold: true, color: NAVY });
  cursor.space(6);
  for (const bloc of model.blocs) {
    cursor.text(bloc.text || "—", { size: 9.5, gap: 3 });
    cursor.space(6);
  }
}

function drawEsfRegionalSections(
  cursor: Cursor,
  fonts: Fonts,
  partnerLogos: PDFImage[]
) {
  const logoBox = 28;
  for (let i = 0; i < ESF_REGIONAL_SECTIONS.length; i++) {
    const section = ESF_REGIONAL_SECTIONS[i];
    const logo = partnerLogos[i] ?? null;
    const line = `${section.phone} - ${section.places}`;
    const textX = cursor.bounds.left + (logo ? logoBox + 8 : 0);
    const lines = wrapText(fonts.regular, line, 8.5, cursor.bounds.right - textX);
    const rowH = Math.max(logoBox, lines.length * 11);
    cursor.ensure(rowH + 4);
    if (logo) {
      drawFitted(cursor.page, logo, {
        x: cursor.bounds.left,
        y: cursor.y - logoBox,
        width: logoBox,
        height: logoBox,
      });
    }
    lines.forEach((textLine, li) => {
      cursor.page.drawText(textLine, {
        x: textX,
        y: cursor.y - 10 - li * 11,
        size: 8.5,
        font: fonts.regular,
        color: INK,
      });
    });
    cursor.y -= rowH + 4;
  }
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
    if (bloc.label) {
      cursor.text(bloc.label, { size: compact ? 8 : 9, bold: true, color: MUTED });
    }
    cursor.text(bloc.text || "—", { size: compact ? 8 : 9.5 });
    cursor.space(compact ? 2 : 3);
  }
}

function drawEsfDocument(
  cursor: Cursor,
  fonts: Fonts,
  model: EvaluationPdfModel,
  esfLogo: PDFImage | null,
  fliCachet: PDFImage | null,
  partnerLogos: PDFImage[]
) {
  // —— Page 1 : en-tête ESF, identité, notes, barème, tarif, T.S.V.P. ——
  const logoSize = 56;
  if (esfLogo) {
    cursor.page.drawImage(esfLogo, {
      x: cursor.bounds.left,
      y: cursor.y - logoSize,
      width: logoSize,
      height: logoSize,
    });
  }
  cursor.text(model.title, {
    size: 13,
    bold: true,
    color: NAVY,
    align: "center",
    gap: 2,
  });
  cursor.y = Math.min(cursor.y, cursor.bounds.top - logoSize - 6);
  cursor.space(4);

  if (model.noteMethodologique) {
    cursor.text(model.noteMethodologique, {
      size: 8,
      italic: true,
      color: MUTED,
      gap: 2,
    });
    cursor.space(2);
  }

  drawEsfMeta(cursor, fonts, model, fliCachet);
  drawEsfSkillsTable(cursor, fonts, model);
  drawEsfBaremeHorizontal(cursor, fonts, model);

  if (model.showPrice && model.priceLabel) {
    cursor.text(`Tarif ${model.priceLabel}`, { size: 11, bold: true, color: INK });
    cursor.space(4);
  }
  cursor.text(ESF_DIRECTOR_NOTE, { size: 9, color: MUTED });
  cursor.space(10);
  cursor.text("T.S.V.P.", {
    size: 10,
    bold: true,
    align: "right",
  });

  // —— Page 2 : appréciations libres, cours, sections régionales ——
  cursor.setBottom(MARGIN_ESF + 24);
  cursor.forceNewPage();
  if (esfLogo) {
    const small = 40;
    cursor.page.drawImage(esfLogo, {
      x: cursor.bounds.left,
      y: cursor.y - small,
      width: small,
      height: small,
    });
    cursor.y -= small + 10;
  }

  drawEsfComments(cursor, model);
  cursor.space(8);
  cursor.text(ESF_COURSE_HEADING, { size: 10, bold: true });
  cursor.space(4);
  drawTable(
    cursor,
    fonts,
    [
      ["", "Niveau d'anglais requis"],
      ...ESF_COURSE_TABLE.map((row) => [row.course, row.level]),
    ],
    [cursor.width * 0.72, cursor.width * 0.28],
    true,
    8
  );
  cursor.space(8);
  cursor.text(ESF_RETEST_NOTE, { size: 9, color: MUTED });
  cursor.space(10);
  drawEsfRegionalSections(cursor, fonts, partnerLogos);
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

  const margin = model.habillage === "esf" ? MARGIN_ESF : MARGIN;
  const bounds: Bounds = model.showDsfLetterhead
    ? { left: 50, right: PAGE.width - 50, top: PAGE.height - 152, bottom: 130 }
    : model.habillage === "esf"
      ? { left: margin, right: PAGE.width - margin, top: PAGE.height - margin, bottom: margin + 28 }
      : model.showFliHeaderFooter
        ? { left: MARGIN, right: PAGE.width - MARGIN, top: PAGE.height - MARGIN, bottom: 48 }
        : { left: MARGIN, right: PAGE.width - MARGIN, top: PAGE.height - MARGIN, bottom: 108 };

  const onPage = (page: PDFPage) => {
    if (model.showDsfLetterhead) drawDsfChrome(page, dsfLetterhead);
  };

  const cursor = new Cursor(doc, fonts, bounds, undefined, onPage);

  if (model.habillage === "esf") {
    drawEsfDocument(cursor, fonts, model, esfLogo, fliCachet, partnerLogos);
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
    if (model.subtitle) {
      cursor.text(model.subtitle, { size: 9, bold: true, color: INK, gap: 2 });
    }
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
    drawSkillsAndBareme(cursor, fonts, model);
    if (model.showPrice && model.priceLabel) {
      cursor.text(`Tarif ${model.priceLabel}`, {
        size: 11,
        bold: true,
        color: TEAL,
      });
      cursor.space(4);
    }
    drawComments(cursor, model, accent);
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
  } else if (model.showDsfLetterhead) {
    cursor.text(model.title, { size: 14, bold: true, color: accent });
    cursor.space(4);
    if (model.subtitle) {
      cursor.text(model.subtitle, { size: 9, bold: true, color: INK, gap: 2 });
    }
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
    drawSkillsTable(cursor, fonts, model, accent);
    drawBaremeTable(cursor, fonts, model, accent, true);
    drawComments(cursor, model, accent);
  } else {
    cursor.text(model.title, { size: 14, bold: true, color: accent });
    cursor.space(4);
    if (model.subtitle) {
      cursor.text(model.subtitle, { size: 9, bold: true, color: INK, gap: 2 });
    }
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
    drawSkillsAndBareme(cursor, fonts, model);
    if (model.showPrice && model.priceLabel) {
      cursor.text(`Tarif ${model.priceLabel}`, {
        size: 11,
        bold: true,
        color: accent,
      });
      cursor.space(4);
    }
    drawComments(cursor, model, accent);
  }

  const pages = doc.getPages();
  const footerBounds: Bounds = model.showDsfLetterhead
    ? bounds
    : {
        left: margin,
        right: PAGE.width - margin,
        top: PAGE.height - margin,
        bottom: 28,
      };
  pages.forEach((page, i) => {
    if (model.showDsfLetterhead) return;
    drawFooter(page, fonts, model, i + 1, pages.length, footerBounds);
  });

  return doc.save();
}
