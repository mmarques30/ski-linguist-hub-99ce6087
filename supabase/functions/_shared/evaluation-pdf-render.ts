/**
 * Rendu PDF (pdf-lib) des trois habillages C.5.
 * Habillage ESF : mise en page calquée sur le .dotx
 * « Évaluation en langue vivante saison 2026 » (Arial → Liberation Sans,
 * formulaire 2 colonnes, tableaux centrés, sections régionales en 2 col.).
 */

import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import type { EvaluationPdfAssets } from "./evaluation-pdf-assets.ts";
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
  esfCycleChecks,
  formatNiveauTableLabel,
  type EvaluationPdfModel,
} from "./evaluation-pdf-model.ts";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 42;
/** Marges .dotx = 720 twips. */
const MARGIN_ESF = 36;
/** Tab .dotx pos=5670 twips depuis la marge gauche. */
const ESF_TAB = MARGIN_ESF + 5670 / 20;
/** Indent Nom/Adresse .dotx left=5245 twips. */
const ESF_NAME_X = MARGIN_ESF + 5245 / 20;
/**
 * Baseline « Nom – Prénom » sous le titre (pt depuis le haut de zone).
 * Le titre centré déborde horizontalement sur ESF_NAME_X (~317 pt de large) :
 * un offset trop faible (ex. 28) cache le nom sous le titre.
 */
const ESF_NAME_BASELINE_FROM_TOP = 58;
const ESF_LOGO = 78;
const ESF_SKILLS_W = (3402 + 1701) / 20;
const ESF_BAREME_W = 10884 / 20;
const ESF_COURSE_W = (6417 + 2389) / 20;
const ESF_COL_GAP = 708 / 20;

const NAVY = rgb(0.07, 0.18, 0.38);
const TEAL = rgb(0.05, 0.32, 0.4);
const GOLD = rgb(0.85, 0.58, 0.08);
const MAGENTA = rgb(0.89, 0.08, 0.42);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.55, 0.55, 0.55);
const BAND = rgb(0.93, 0.95, 0.97);
const BLACK = rgb(0, 0, 0);

export type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };

function pdfSafe(text: string): string {
  // Liberation Sans / WinAnsi : tirets et apostrophes typographiques OK.
  return text
    .replace(/\u2192/g, "->")
    .replace(/\u00A0/g, " ")
    .replace(/\u25A1/g, "")
    .replace(/\u2610/g, "")
    .replace(/\u2611/g, "");
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

async function embedEsfFonts(doc: PDFDocument, assets: EvaluationPdfAssets): Promise<Fonts> {
  const regularBytes = assets.fonts?.regular;
  const boldBytes = assets.fonts?.bold;
  const italicBytes = assets.fonts?.italic;
  if (regularBytes?.byteLength && boldBytes?.byteLength) {
    try {
      doc.registerFontkit(fontkit);
      return {
        regular: await doc.embedFont(regularBytes, { subset: true }),
        bold: await doc.embedFont(boldBytes, { subset: true }),
        italic: italicBytes?.byteLength
          ? await doc.embedFont(italicBytes, { subset: true })
          : await doc.embedFont(regularBytes, { subset: true }),
      };
    } catch {
      // repli Helvetica
    }
  }
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
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
      underline?: boolean;
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
    const gap = opts.gap ?? 2.5;
    for (const line of lines) {
      this.ensure(size + gap);
      let x = x0;
      const tw = font.widthOfTextAtSize(line, size);
      if (opts.align === "center") x = x0 + (maxWidth - tw) / 2;
      else if (opts.align === "right") x = x0 + maxWidth - tw;
      const y = this.y - size;
      this.page.drawText(line, { x, y, size, font, color });
      if (opts.underline) {
        this.page.drawLine({
          start: { x, y: y - 1.5 },
          end: { x: x + tw, y: y - 1.5 },
          thickness: 0.7,
          color,
        });
      }
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

function drawCheckbox(
  page: PDFPage,
  x: number,
  y: number,
  checked: boolean,
  size = 8
) {
  page.drawRectangle({
    x,
    y: y - 1,
    width: size,
    height: size,
    borderWidth: 0.8,
    borderColor: BLACK,
  });
  if (checked) {
    page.drawLine({
      start: { x: x + 1.5, y: y + 2.5 },
      end: { x: x + size / 2 - 0.2, y: y - 0.2 },
      thickness: 1.1,
      color: BLACK,
    });
    page.drawLine({
      start: { x: x + size / 2 - 0.2, y: y - 0.2 },
      end: { x: x + size - 1.2, y: y + size - 2 },
      thickness: 1.1,
      color: BLACK,
    });
  }
}

function drawTable(
  cursor: Cursor,
  fonts: Fonts,
  rows: string[][],
  colWidths: number[],
  header = false,
  size = 7.5,
  opts: {
    x?: number;
    headerFill?: boolean;
    centerCols?: number[];
    boldRows?: number[];
  } = {}
) {
  const pad = 3.5;
  const tableX = opts.x ?? cursor.bounds.left;
  const centerCols = new Set(opts.centerCols ?? []);
  const boldRows = new Set(opts.boldRows ?? []);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const useBold = (i === 0 && header) || boldRows.has(i);
    const wrapped = row.map((cell, ci) =>
      wrapText(useBold ? fonts.bold : fonts.regular, cell, size, colWidths[ci] - pad * 2)
    );
    const lineCount = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = lineCount * (size + 2) + pad * 2;
    cursor.ensure(rowH);
    let x = tableX;
    if (i === 0 && header && opts.headerFill !== false) {
      cursor.page.drawRectangle({
        x: tableX,
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
        borderWidth: 0.6,
        borderColor: RULE,
      });
      wrapped[ci].forEach((line, li) => {
        const font = useBold ? fonts.bold : fonts.regular;
        const tw = font.widthOfTextAtSize(line, size);
        const tx = centerCols.has(ci)
          ? x + (colWidths[ci] - tw) / 2
          : x + pad;
        cursor.page.drawText(line, {
          x: tx,
          y: cursor.y - pad - size - li * (size + 2),
          size,
          font,
          color: BLACK,
        });
      });
      x += colWidths[ci];
    }
    cursor.y -= rowH;
  }
}

function drawEsfBaremeHorizontal(cursor: Cursor, fonts: Fonts, model: EvaluationPdfModel) {
  const rows = model.baremeRows;
  const cols = Math.max(1, rows.length);
  const tableW = Math.min(ESF_BAREME_W, cursor.width);
  const tableX = cursor.bounds.left + (cursor.width - tableW) / 2;
  const colW = tableW / cols;
  const pad = 2.5;
  const titleSize = 10;
  const cellSize = 8;
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
  const niveauH = (cellSize + 1.2) * 2 + pad * 2;
  const labelsH = labelLineCount * (cellSize + 1.2) + pad * 2;

  cursor.ensure(titleH + cecrlH + niveauH + labelsH);
  const x0 = tableX;

  cursor.page.drawRectangle({
    x: x0,
    y: cursor.y - titleH,
    width: tableW,
    height: titleH,
    borderWidth: 0.6,
    borderColor: RULE,
  });
  const title = pdfSafe(ESF_BAREME_HEADING);
  const titleWidth = fonts.bold.widthOfTextAtSize(title, titleSize);
  cursor.page.drawText(title, {
    x: x0 + (tableW - titleWidth) / 2,
    y: cursor.y - pad - titleSize,
    size: titleSize,
    font: fonts.bold,
    color: BLACK,
  });
  cursor.y -= titleH;

  const drawRow = (
    getText: (i: number) => string | string[],
    size: number,
    rowH: number,
    bold = false
  ) => {
    let x = x0;
    for (let i = 0; i < cols; i++) {
      cursor.page.drawRectangle({
        x,
        y: cursor.y - rowH,
        width: colW,
        height: rowH,
        borderWidth: 0.6,
        borderColor: RULE,
      });
      const raw = getText(i);
      const font = bold ? fonts.bold : fonts.regular;
      const lines = Array.isArray(raw)
        ? raw.map((l) => pdfSafe(l))
        : wrapText(font, raw, size, colW - pad * 2);
      lines.forEach((line, li) => {
        const tw = font.widthOfTextAtSize(line, size);
        cursor.page.drawText(line, {
          x: x + Math.max(pad, (colW - tw) / 2),
          y: cursor.y - pad - size - li * (size + 1.2),
          size,
          font,
          color: BLACK,
        });
      });
      x += colW;
    }
    cursor.y -= rowH;
  };

  drawRow((i) => cellLines[i].cecrl, cellSize, cecrlH, true);
  drawRow((i) => {
    // .dotx : « Niveau » / « d'entrée 0 » sur 2 lignes pour A1
    if (cellLines[i].niveau.startsWith("Niveau d'entrée")) {
      return ["Niveau", "d'entrée 0"];
    }
    return cellLines[i].niveau;
  }, cellSize, niveauH, false);
  drawRow((i) => cellLines[i].labels, cellSize, labelsH, false);
  cursor.space(8);
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
  if (model.habillage === "esf") {
    const prefix = "Page ";
    const mid = " sur ";
    const n1 = String(index);
    const n2 = String(total);
    const size = 9;
    const w =
      fonts.regular.widthOfTextAtSize(prefix, size) +
      fonts.bold.widthOfTextAtSize(n1, size) +
      fonts.regular.widthOfTextAtSize(mid, size) +
      fonts.bold.widthOfTextAtSize(n2, size);
    let x = PAGE.width - MARGIN_ESF - w;
    const y = 18;
    page.drawText(prefix, { x, y, size, font: fonts.regular, color: BLACK });
    x += fonts.regular.widthOfTextAtSize(prefix, size);
    page.drawText(n1, { x, y, size, font: fonts.bold, color: BLACK });
    x += fonts.bold.widthOfTextAtSize(n1, size);
    page.drawText(mid, { x, y, size, font: fonts.regular, color: BLACK });
    x += fonts.regular.widthOfTextAtSize(mid, size);
    page.drawText(n2, { x, y, size, font: fonts.bold, color: BLACK });
    return;
  }

  const pageLabel = `Page ${index} / ${total}`;
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
    cursor.kv("École de ski :", model.skiSchoolName);
  }
  cursor.kv("Langue évaluée :", model.languageLabel);
  cursor.kv("Avez-vous déjà été évalué(e) ?", model.previousTestLabel);
  cursor.kv("Date de l'évaluation :", model.evaluatedOn);
  cursor.kv("Nom de l'évaluateur / formateur :", model.instructorName);
  cursor.kv("Profession :", model.candidateProfession);
  cursor.space(4);
}

function drawEsfFieldLine(
  cursor: Cursor,
  fonts: Fonts,
  left: string,
  right: string,
  size = 10
) {
  const rowH = size + 5;
  cursor.ensure(rowH);
  const y = cursor.y - size;
  cursor.page.drawText(pdfSafe(left), {
    x: cursor.bounds.left,
    y,
    size,
    font: fonts.regular,
    color: BLACK,
  });
  if (right) {
    cursor.page.drawText(pdfSafe(right), {
      x: ESF_TAB,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
  }
  cursor.y -= rowH;
}

function drawEsfCheckboxGroup(
  cursor: Cursor,
  fonts: Fonts,
  items: { label: string; checked: boolean }[],
  opts: { x?: number; size?: number; gap?: number } = {}
) {
  const size = opts.size ?? 10;
  const box = 8;
  let x = opts.x ?? cursor.bounds.left;
  const y = cursor.y - size;
  cursor.ensure(size + 6);
  for (const item of items) {
    drawCheckbox(cursor.page, x, y, item.checked, box);
    const label = pdfSafe(item.label);
    cursor.page.drawText(label, {
      x: x + box + 4,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    x += box + 4 + fonts.regular.widthOfTextAtSize(label, size) + (opts.gap ?? 18);
  }
  cursor.y -= size + 6;
}

/** Identité page 1 — même disposition que le .dotx (tabs + cases). */
function drawEsfMeta(
  cursor: Cursor,
  fonts: Fonts,
  model: EvaluationPdfModel,
  fliCachet: PDFImage | null
) {
  const size = 10;
  // Nom / Adresse déjà posés dans l'en-tête (bandeau logo).

  drawEsfFieldLine(
    cursor,
    fonts,
    `ESF : ${model.skiSchoolName}`,
    `N° Carte Syndicale : ${model.carteSyndicale}`
  );
  // Langue + déjà évalué avec cases
  {
    const rowH = size + 6;
    cursor.ensure(rowH);
    const y = cursor.y - size;
    cursor.page.drawText(pdfSafe(`Langue(s) : ${model.languageLabel}`), {
      x: cursor.bounds.left,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    const right = "Avez-vous déjà été évalué(e) ?";
    cursor.page.drawText(pdfSafe(right), {
      x: ESF_TAB,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    const boxX =
      ESF_TAB + fonts.regular.widthOfTextAtSize(pdfSafe(right), size) + 8;
    drawCheckbox(cursor.page, boxX, y, model.previousTestLabel === "OUI");
    cursor.page.drawText("OUI", {
      x: boxX + 11,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    drawCheckbox(cursor.page, boxX + 42, y, model.previousTestLabel === "NON");
    cursor.page.drawText("NON", {
      x: boxX + 53,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    cursor.y -= rowH;
  }

  drawEsfFieldLine(
    cursor,
    fonts,
    "(demandée(s) pour évaluation)",
    `Pour quelle(s) langue(s) ? ${
      model.previousTestLabel === "OUI" ? model.languageLabel : "............................."
    }`
  );

  // Niveau Alpin / Nordique
  {
    const rowH = size + 6;
    cursor.ensure(rowH);
    const y = cursor.y - size;
    const left = "A quel niveau de formation êtes-vous ?";
    cursor.page.drawText(pdfSafe(left), {
      x: cursor.bounds.left,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    const disc = (model.skiDiscipline || "").toLowerCase();
    let x = ESF_TAB;
    drawCheckbox(cursor.page, x, y, disc === "alpin");
    cursor.page.drawText("Alpin", {
      x: x + 11,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    x += 60;
    drawCheckbox(cursor.page, x, y, disc === "nordique");
    cursor.page.drawText("Nordique", {
      x: x + 11,
      y,
      size,
      font: fonts.regular,
      color: BLACK,
    });
    cursor.y -= rowH;
  }

  const cycles = esfCycleChecks(model.trainingCycle);
  drawEsfCheckboxGroup(cursor, fonts, [
    { label: "Cycle préparatoire", checked: cycles.preparatoire },
    { label: "1er Cycle", checked: cycles.premier },
    { label: "2ème Cycle", checked: cycles.deuxieme },
    { label: "Titulaire du DE", checked: cycles.titulaireDe },
  ], { x: cursor.bounds.left + 20, gap: 14 });

  // Organisme + cachet
  const stampW = 140;
  const stampH = 82;
  const orgLine = `Nom de l'organisme de formation : ${ESF_ORGANISM_NAME}`;
  cursor.ensure(Math.max(stampH + 14, size + 8));
  cursor.page.drawText(pdfSafe(orgLine), {
    x: cursor.bounds.left,
    y: cursor.y - size,
    size,
    font: fonts.regular,
    color: BLACK,
  });
  if (fliCachet) {
    const cap = pdfSafe(ESF_CACHET_CAPTION);
    const capW = fonts.regular.widthOfTextAtSize(cap, 8);
    const stampX = cursor.bounds.right - stampW;
    cursor.page.drawText(cap, {
      x: stampX + (stampW - capW) / 2,
      y: cursor.y - 8,
      size: 8,
      font: fonts.regular,
      color: BLACK,
    });
    drawFitted(cursor.page, fliCachet, {
      x: stampX,
      y: cursor.y - 10 - stampH,
      width: stampW,
      height: stampH,
    });
    cursor.y -= stampH + 16;
  } else {
    cursor.y -= size + 8;
  }

  drawEsfFieldLine(cursor, fonts, `Date de l'évaluation : ${model.evaluatedOn}`, "");
  drawEsfFieldLine(
    cursor,
    fonts,
    `Nom de l'évaluateur / formateur : ${model.instructorName}`,
    ""
  );
  cursor.space(8);
}

function drawEsfSkillsTable(cursor: Cursor, fonts: Fonts, model: EvaluationPdfModel) {
  const tableW = Math.min(ESF_SKILLS_W, cursor.width);
  const col1 = tableW * (3402 / (3402 + 1701));
  const col2 = tableW - col1;
  const tableX = cursor.bounds.left + (cursor.width - tableW) / 2;
  drawTable(
    cursor,
    fonts,
    [
      ["", "Niveau de 0 à 5"],
      ...model.skillRows.map((row) => [row.label, row.value]),
    ],
    [col1, col2],
    true,
    10,
    {
      x: tableX,
      headerFill: false,
      centerCols: [1],
      boldRows: [model.skillRows.length],
    }
  );
  cursor.space(10);
}

function drawEsfComments(cursor: Cursor, model: EvaluationPdfModel) {
  cursor.text(ESF_APPRECIATION_HEADING, {
    size: 10,
    bold: false,
    color: BLACK,
    underline: true,
  });
  cursor.space(6);
  for (const bloc of model.blocs) {
    cursor.text(bloc.text || "—", { size: 10, gap: 2.5, color: BLACK });
    cursor.space(4);
  }
  cursor.space(8);
}

function drawEsfRegionalSections(
  cursor: Cursor,
  fonts: Fonts,
  partnerLogos: PDFImage[]
) {
  // .dotx : section 2 colonnes après le paragraphe de section break
  const gap = ESF_COL_GAP;
  const colW = (cursor.width - gap) / 2;
  const leftX = cursor.bounds.left;
  const rightX = leftX + colW + gap;
  const leftItems = ESF_REGIONAL_SECTIONS.slice(0, 4);
  const rightItems = ESF_REGIONAL_SECTIONS.slice(4);
  const logoH = 36;

  const measureCol = (items: typeof leftItems, logoOffset: number) => {
    let h = 0;
    for (let i = 0; i < items.length; i++) {
      const line = `${items[i].phone} - ${items[i].places}`;
      const lines = wrapText(fonts.regular, line, 8, colW - 4);
      h += logoH + 2 + lines.length * 10 + 10;
    }
    return h;
  };
  const totalH = Math.max(
    measureCol(leftItems, 0),
    measureCol(rightItems, 4)
  );
  cursor.ensure(totalH);

  const drawCol = (items: typeof leftItems, x: number, logoOffset: number) => {
    let y = cursor.y;
    for (let i = 0; i < items.length; i++) {
      const logo = partnerLogos[logoOffset + i] ?? null;
      if (logo) {
        drawFitted(cursor.page, logo, {
          x,
          y: y - logoH,
          width: Math.min(110, colW),
          height: logoH,
        });
      }
      y -= logoH + 2;
      const line = `${items[i].phone} - ${items[i].places}`;
      const lines = wrapText(fonts.regular, line, 8, colW - 4);
      for (const textLine of lines) {
        cursor.page.drawText(textLine, {
          x,
          y: y - 8,
          size: 8,
          font: fonts.regular,
          color: BLACK,
        });
        y -= 10;
      }
      y -= 10;
    }
  };

  drawCol(leftItems, leftX, 0);
  drawCol(rightItems, rightX, 4);
  cursor.y -= totalH;
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

function drawEsfHeaderLogo(page: PDFPage, esfLogo: PDFImage | null, top: number) {
  if (!esfLogo) return;
  page.drawImage(esfLogo, {
    x: MARGIN_ESF,
    y: top - ESF_LOGO,
    width: ESF_LOGO,
    height: ESF_LOGO,
  });
}

function drawEsfDocument(
  cursor: Cursor,
  fonts: Fonts,
  model: EvaluationPdfModel,
  esfLogo: PDFImage | null,
  fliCachet: PDFImage | null,
  partnerLogos: PDFImage[]
) {
  // En-tête .dotx : logo à gauche, titre centré, Nom/Adresse à droite sous le titre.
  const headerTop = cursor.bounds.top;
  drawEsfHeaderLogo(cursor.page, esfLogo, headerTop + 4);
  cursor.y = headerTop - 8;
  cursor.text(model.title, {
    size: 14,
    bold: true,
    color: BLACK,
    align: "center",
    gap: 2,
  });
  const size = 10;
  const nameY = headerTop - ESF_NAME_BASELINE_FROM_TOP;
  cursor.page.drawText(pdfSafe(`Nom – Prénom : ${model.candidateDisplayName}`), {
    x: ESF_NAME_X,
    y: nameY,
    size,
    font: fonts.regular,
    color: BLACK,
  });
  cursor.page.drawText(pdfSafe("Adresse :"), {
    x: ESF_NAME_X,
    y: nameY - size - 4,
    size,
    font: fonts.regular,
    color: BLACK,
  });
  cursor.y = Math.min(cursor.y, headerTop - ESF_LOGO - 8, nameY - size - 4 - 6);
  cursor.space(8);

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
    cursor.text(`Tarif ${model.priceLabel}`, { size: 10, color: BLACK });
    cursor.space(4);
  }
  cursor.text(ESF_DIRECTOR_NOTE, { size: 10, color: BLACK });
  cursor.space(8);
  cursor.text("T.S.V.P.", {
    size: 9,
    italic: true,
    align: "right",
    color: BLACK,
  });

  // Page 2
  cursor.setBottom(MARGIN_ESF + 24);
  cursor.forceNewPage();
  drawEsfHeaderLogo(cursor.page, esfLogo, cursor.bounds.top + 4);
  cursor.y = cursor.bounds.top - ESF_LOGO - 8;

  drawEsfComments(cursor, model);
  cursor.text(ESF_COURSE_HEADING, { size: 10, color: BLACK });
  cursor.space(4);
  {
    const tableW = Math.min(ESF_COURSE_W, cursor.width);
    const col1 = tableW * (6417 / (6417 + 2389));
    const col2 = tableW - col1;
    const tableX = cursor.bounds.left + (cursor.width - tableW) / 2;
    drawTable(
      cursor,
      fonts,
      [
        ["", "Niveau d'anglais requis"],
        ...ESF_COURSE_TABLE.map((row) => [row.course, row.level]),
      ],
      [col1, col2],
      true,
      9,
      { x: tableX, headerFill: false, centerCols: [1] }
    );
  }
  cursor.space(6);
  cursor.text(ESF_RETEST_NOTE, { size: 10, color: BLACK });
  cursor.space(14);
  drawEsfRegionalSections(cursor, fonts, partnerLogos);
}

export async function renderEvaluationPdf(
  model: EvaluationPdfModel,
  assets: EvaluationPdfAssets = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts =
    model.habillage === "esf"
      ? await embedEsfFonts(doc, assets)
      : {
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
      ? {
          left: margin,
          right: PAGE.width - margin,
          top: PAGE.height - margin,
          bottom: margin + 28,
        }
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

  // silence unused import warning for ESF_PAGE_LABEL in some bundlers
  void ESF_PAGE_LABEL;

  return doc.save();
}
