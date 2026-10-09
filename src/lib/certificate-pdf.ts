/**
 * Certificat d'assiduité et de fin de formation — modèle Word 2024.
 * Rendu pdf-lib (comme conventions) pour que logo / cachet s'affichent
 * correctement dans Chrome / Acrobat (PNG RGB, pas indexé jsPDF).
 */
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import {
  CERTIFICATE_SNMSF_DISCLAIMER,
  OBJECTIF_ATTEINT_LABELS,
  type CertificateBilanData,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;

/** Assets RGB dédiés certificat (évite PNG indexé illisible dans certains lecteurs). */
export const CERTIFICATE_ASSET_FILES = {
  letterhead: "fli-entete-cert.png",
  cachet: "fli-signature-cachet-cert.png",
} as const;

/** Bloc organisme — mêmes coordonnées que les factures FLI. */
export const CERTIFICATE_ORG = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  cityLine: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  activityNumber: "82 73 01 366 73",
  representative: "Paula Rangel Halbwachs",
  signatory: "Paula RANGEL-HALBWACHS",
} as const;

/**
 * Pied exact du modèle Word « Certificat 2024 »
 * (Version 2 du 8 septembre 2021).
 */
export const CERTIFICATE_FLI_FOOTER_LINES = [
  "Formation Professionnelle Continue : Langues Etrangères",
  "SARL au capital de 5000 euros. 25 avenue de la gare, 73800 Montmélian",
  "Siret : 484 772 041 00048- RCS Chambéry – NAF : 8559A Organisme de formation n° 82 73 01 366 73",
  "Version 2 du 8 septembre 2021",
] as const;

const FOOTER_H = 56;
const FLI_YELLOW = rgb(252 / 255, 175 / 255, 23 / 255);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const FOOTER_GREY = rgb(0.5, 0.5, 0.5);

function pdfSafe(text: string): string {
  return text
    .replace(/\u2192/g, "->")
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/\u00B7/g, "·");
}

function formatFrDate(isoOrFr: string | null | undefined): string {
  if (!isoOrFr) return "…";
  const raw = String(isoOrFr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${parsed.getFullYear()}`;
}

function formationPhrase(language: string, locationOrModality: string | null): string {
  const lang = (language || "…").trim();
  const mod = (locationOrModality || "").toLowerCase();
  if (mod.includes("collect") || mod.includes("groupe") || mod.includes("station")) {
    return `une formation collective en ${lang}`;
  }
  return `une formation individualisée en ${lang}`;
}

function formatLieu(locationOrModality: string | null): string {
  const raw = (locationOrModality || "").trim();
  if (!raw) return "…";
  const lower = raw.toLowerCase();
  if (
    lower === "en_ligne" ||
    lower === "en ligne" ||
    lower.includes("online") ||
    lower.includes("visio") ||
    lower === "distance" ||
    lower === "distanciel"
  ) {
    return "En ligne";
  }
  return raw.replace(/_/g, " ");
}

async function loadPublicBytes(
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

export async function loadCertificateLetterheadBytes(
  override?: Uint8Array | null
): Promise<Uint8Array | null> {
  return loadPublicBytes(
    `inscription-documents/${CERTIFICATE_ASSET_FILES.letterhead}`,
    override
  );
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
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export type BuildCertificatePdfOptions = {
  letterheadPng?: Uint8Array | null;
  cachetPng?: Uint8Array | null;
};

/** Génère le PDF certificat pour end pack / stockage. */
export async function buildCertificatePdfBlob(
  data: CertificateBilanData,
  options?: BuildCertificatePdfOptions
): Promise<Blob> {
  const bytes = await buildCertificatePdfBytes(data, options);
  return new Blob([bytes], { type: "application/pdf" });
}

export async function buildCertificatePdfBytes(
  data: CertificateBilanData,
  options?: BuildCertificatePdfOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE.width, PAGE.height]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const [letterheadBytes, cachetBytes] = await Promise.all([
    loadCertificateLetterheadBytes(options?.letterheadPng),
    loadPublicBytes(
      `inscription-documents/${CERTIFICATE_ASSET_FILES.cachet}`,
      options?.cachetPng
    ),
  ]);

  let letterhead = null;
  let cachet = null;
  if (letterheadBytes?.byteLength) {
    try {
      letterhead = await doc.embedPng(letterheadBytes);
    } catch {
      letterhead = null;
    }
  }
  if (cachetBytes?.byteLength) {
    try {
      cachet = await doc.embedPng(cachetBytes);
    } catch {
      cachet = null;
    }
  }

  let y = PAGE.height - 28;

  // Logo à gauche
  if (letterhead) {
    const logoW = 150;
    const scale = logoW / letterhead.width;
    const logoH = letterhead.height * scale;
    page.drawImage(letterhead, {
      x: MARGIN,
      y: y - logoH,
      width: logoW,
      height: logoH,
    });
    y -= logoH + 10;
  }

  // Bloc infos organisme
  const orgLines: { text: string; bold?: boolean; size?: number }[] = [
    { text: CERTIFICATE_ORG.name, bold: true, size: 11 },
    { text: CERTIFICATE_ORG.address, size: 9 },
    { text: CERTIFICATE_ORG.cityLine, size: 9 },
    {
      text: `Tél. ${CERTIFICATE_ORG.phone}  ·  ${CERTIFICATE_ORG.email}`,
      size: 9,
    },
    { text: `SIRET ${CERTIFICATE_ORG.siret}`, size: 9 },
    {
      text: `Organisme de formation n° ${CERTIFICATE_ORG.activityNumber}`,
      size: 9,
    },
  ];
  for (const row of orgLines) {
    const size = row.size ?? 9;
    const f = row.bold ? fontBold : font;
    page.drawText(pdfSafe(row.text), {
      x: MARGIN,
      y: y - size,
      size,
      font: f,
      color: row.bold ? INK : MUTED,
    });
    y -= size + 3;
  }

  // Filet jaune FLI
  y -= 6;
  page.drawRectangle({
    x: MARGIN,
    y: y - 2.5,
    width: PAGE.width - MARGIN * 2,
    height: 2.5,
    color: FLI_YELLOW,
  });
  y -= 22;

  const contentWidth = PAGE.width - MARGIN * 2;
  const drawCentered = (text: string, size: number, bold = false) => {
    const f = bold ? fontBold : font;
    const w = f.widthOfTextAtSize(pdfSafe(text), size);
    page.drawText(pdfSafe(text), {
      x: (PAGE.width - w) / 2,
      y: y - size,
      size,
      font: f,
      color: INK,
    });
    y -= size + 10;
  };

  const drawPara = (
    text: string,
    opts?: { bold?: boolean; italic?: boolean; size?: number; indent?: number }
  ) => {
    const size = opts?.size ?? 10;
    const f = opts?.bold ? fontBold : opts?.italic ? fontItalic : font;
    const indent = opts?.indent ?? 0;
    const lines = wrapText(f, text, size, contentWidth - indent);
    for (const ln of lines) {
      if (y < FOOTER_H + 40) break;
      page.drawText(ln, {
        x: MARGIN + indent,
        y: y - size,
        size,
        font: f,
        color: INK,
      });
      y -= size + 3.5;
    }
    y -= 4;
  };

  drawCentered("Certificat d'assiduité et de fin de formation", 15, true);

  drawPara("Pour servir ce que de droit,");
  drawPara(
    `Je soussignée ${CERTIFICATE_ORG.representative}, responsable de ${CERTIFICATE_ORG.name}, atteste que :`
  );
  drawPara(
    `${data.studentName} a suivi ${formationPhrase(
      data.language,
      data.locationOrModality
    )}.`,
    { bold: true, size: 11 }
  );

  const hours = data.hoursFollowed ?? data.durationHoursPlanned;
  drawPara(
    `Dates de la formation : du ${formatFrDate(data.startDate)} au ${formatFrDate(data.endDate)}.`
  );
  drawPara(
    `Durée de la formation : ${hours != null ? `${hours} heures` : "…"}.`
  );
  drawPara(`Lieu de la formation : ${formatLieu(data.locationOrModality)}.`);
  if (data.formateurName) {
    drawPara(`Formateur·rice : ${data.formateurName}.`);
  }

  drawPara("Niveaux atteints à la fin de la formation :", { bold: true });
  drawPara(`Langue générale : ${data.niveauGeneralSortie}.`, { indent: 16 });
  drawPara(`Langage technique : ${data.niveauTechniqueSortie}.`, {
    indent: 16,
  });

  drawPara("Bilan de progression (entrée -> sortie)", { bold: true });
  drawPara(
    `Niveau général — Entrée : ${data.niveauGeneralEntree}  |  Sortie : ${data.niveauGeneralSortie}`,
    { size: 9, indent: 12 }
  );
  drawPara(
    `Niveau technique — Entrée : ${data.niveauTechniqueEntree}  |  Sortie : ${data.niveauTechniqueSortie}`,
    { size: 9, indent: 12 }
  );
  const objectif =
    OBJECTIF_ATTEINT_LABELS[data.objectifAtteint as ObjectifAtteint] ||
    data.objectifAtteint;
  drawPara(`Objectif pédagogique atteint : ${objectif}`, {
    size: 9,
    indent: 12,
  });
  if (data.commentaire?.trim()) {
    drawPara(data.commentaire.trim(), { size: 9, indent: 12 });
  }

  drawPara(CERTIFICATE_SNMSF_DISCLAIMER, { italic: true, size: 8 });
  drawPara(
    "En conséquence de quoi le présent certificat lui est délivré pour servir ce que de droit."
  );
  drawPara(`Fait à Montmélian, le ${formatFrDate(data.issueDate)}.`);
  if (data.inscriptionCode) {
    drawPara(`Réf. inscription : ${data.inscriptionCode}`, { size: 8 });
  }

  y -= 10;
  const colLeft = MARGIN + 10;
  const colRight = PAGE.width / 2 + 10;
  page.drawText("La stagiaire", {
    x: colLeft,
    y: y - 10,
    size: 10,
    font,
    color: INK,
  });
  page.drawText("F.L.I.", {
    x: colRight,
    y: y - 10,
    size: 10,
    font,
    color: INK,
  });
  y -= 22;
  page.drawText(CERTIFICATE_ORG.signatory, {
    x: colRight,
    y: y - 9,
    size: 9,
    font: fontBold,
    color: INK,
  });
  y -= 14;

  if (cachet) {
    const cachetW = 120;
    const scale = cachetW / cachet.width;
    const cachetH = cachet.height * scale;
    page.drawImage(cachet, {
      x: colRight,
      y: Math.max(FOOTER_H + 8, y - cachetH),
      width: cachetW,
      height: cachetH,
    });
  }

  drawFooter(page, font, fontBold);

  return doc.save();
}

function drawFooter(page: PDFPage, font: PDFFont, fontBold: PDFFont) {
  let fy = FOOTER_H - 4;
  page.drawLine({
    start: { x: MARGIN, y: fy + 14 },
    end: { x: PAGE.width - MARGIN, y: fy + 14 },
    thickness: 0.6,
    color: rgb(0.6, 0.6, 0.6),
  });
  for (let i = 0; i < CERTIFICATE_FLI_FOOTER_LINES.length; i += 1) {
    const text = CERTIFICATE_FLI_FOOTER_LINES[i];
    const f = i === 0 ? fontBold : font;
    const size = 7;
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (PAGE.width - w) / 2,
      y: fy,
      size,
      font: f,
      color: FOOTER_GREY,
    });
    fy -= 9;
  }
}
