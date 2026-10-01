/**
 * Fiches de présence FORMATEUR / STAGIAIRE — calquées sur les modèles Word 2025
 * (docs/presence-fiches/*.dotx).
 *
 * Usage métier actuel : signature à chaque cours, envoi des feuilles signées
 * à FLI en fin de séances. Génération BO uniquement (pas de signature en ligne).
 */

import jsPDF from "jspdf";

export type PresenceFicheKind = "formateur" | "stagiaire";

export type PresenceFicheInput = {
  language: string;
  startDate: string | null;
  endDate: string | null;
  durationHours: number | null;
  /** Lieu affiché (ex. « En ligne », station…). */
  locationLabel: string;
  studentName: string;
  formateurName: string;
  studentPostalCode?: string | null;
  studentCity?: string | null;
  /** Nombre de lignes de cours vides (défaut : modèles Word ≈ 15). */
  courseRowCount?: number;
  /** Data URL PNG/JPEG du logo FLI (en-tête). */
  logoDataUrl?: string | null;
};

const DEFAULT_COURSE_ROWS = 12;
const MARGIN = 14;
/** Réserve bas de page pour le pied légal FLI. */
const LEGAL_FOOTER_H = 18;
/** Hauteur du bloc « total / fait à / signature responsable ». */
const SIGNATURE_CONTENT_H = 24;
/** Réserve bas de page (signatures + pied légal) sur la dernière page. */
const BOTTOM_RESERVE_H = LEGAL_FOOTER_H + SIGNATURE_CONTENT_H + 4;

/**
 * Pied de page FLI — texte fourni par Paula (capture 2026-10-01).
 * Aligné sur les conventions / programmes, avec mention F.L.I.
 */
export const FLI_PRESENCE_FOOTER_LINES = [
  "Formation Professionnelle Continue : Langues Etrangères",
  "SARL au capital de 5000 euros. F.L.I. 25 avenue de la gare, 73800 Montmélian",
  "Siret : 484 772 041 00048- RCS Chambéry – NAF : 8559A - Organisme de formation n° 82 73 01 366 73",
] as const;

export function formatPresenceDate(iso: string | null | undefined): string {
  if (!iso) return "…";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
      const [y, m, day] = iso.slice(0, 10).split("-");
      return `${Number(day)}/${Number(m)}/${y}`;
    }
    return iso;
  }
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function presenceFormationTitle(
  kind: PresenceFicheKind,
  language: string
): string {
  const lang = (language || "…").trim();
  if (kind === "formateur") return `formation individualisée ${lang}`;
  return `Formation en ligne individuelle en ${lang}.`;
}

export function presenceLocationLabel(input: {
  modality?: string | null;
  courseLocation?: string | null;
}): string {
  const mod = (input.modality || "").toLowerCase();
  const loc = (input.courseLocation || "").trim();
  if (loc) return loc;
  if (
    mod.includes("ligne") ||
    mod.includes("online") ||
    mod.includes("visio") ||
    mod === "en_ligne" ||
    mod === "distance"
  ) {
    return "En ligne";
  }
  return "—";
}

export function presenceFicheFilename(
  kind: PresenceFicheKind,
  studentName: string,
  code?: string | null
): string {
  const who = (studentName || "stagiaire")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  const prefix = kind === "formateur" ? "Fiche_presence_FORMATEUR" : "Fiche_presence_STAGIAIRE";
  return `${prefix}_${code || who}_2025.pdf`;
}

/** Charge une URL (asset Vite ou /public) en data URL pour jsPDF. */
export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawLegalFooter(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = pageHeight - LEGAL_FOOTER_H + 2;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(MARGIN, y - 3, pageWidth - MARGIN, y - 3);
  pdf.setTextColor(90, 90, 90);
  FLI_PRESENCE_FOOTER_LINES.forEach((text, i) => {
    pdf.setFont("helvetica", i === 0 ? "bold" : "normal");
    pdf.setFontSize(7);
    pdf.text(text, pageWidth / 2, y, { align: "center" });
    y += 3.6;
  });
  pdf.setTextColor(0, 0, 0);
}

function drawBrandHeader(
  pdf: jsPDF,
  kind: PresenceFicheKind,
  logoDataUrl?: string | null
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 10;

  if (logoDataUrl) {
    try {
      const logoW = 48;
      const logoH = 18;
      pdf.addImage(logoDataUrl, "PNG", (pageWidth - logoW) / 2, y, logoW, logoH);
      y += logoH + 4;
    } catch {
      // logo illisible → titre texte seul
    }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(
    kind === "formateur" ? "Fiche de présence — FORMATEUR" : "Fiche de présence — STAGIAIRE",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 7;
  return y;
}

function drawMetaBlock(
  pdf: jsPDF,
  kind: PresenceFicheKind,
  data: PresenceFicheInput,
  y: number
): number {
  const line = (label: string, value: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(label, MARGIN, y);
    pdf.setFont("helvetica", "normal");
    const labelW = pdf.getTextWidth(label);
    pdf.text(value || "—", MARGIN + labelW + 2, y);
    y += 5.5;
  };

  line("Intitulé de la formation :", presenceFormationTitle(kind, data.language));
  line(
    "Dates de la formation :",
    `Du ${formatPresenceDate(data.startDate)} au ${formatPresenceDate(data.endDate)}`
  );
  line(
    "Durée du pack :",
    data.durationHours != null ? `${data.durationHours} heures` : "… heures"
  );
  if (kind === "stagiaire") {
    const cp = (data.studentPostalCode || "").trim();
    const city = (data.studentCity || "").trim();
    const place =
      data.locationLabel.toLowerCase().includes("ligne") || !data.locationLabel
        ? `En ligne : ${[cp, city].filter(Boolean).join(" ") || "…"}`
        : data.locationLabel;
    line("Lieu :", place);
  } else {
    line("Lieu :", data.locationLabel || "En ligne");
  }
  line("Nom du stagiaire :", data.studentName || "—");
  line("Nom et prénom du formateur :", data.formateurName || "—");
  y += 3;
  return y;
}

function drawCourseTable(
  pdf: jsPDF,
  kind: PresenceFicheKind,
  data: PresenceFicheInput,
  y: number,
  logoDataUrl?: string | null
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const colW = pageWidth - MARGIN * 2;
  const c1 = MARGIN;
  const c2 = MARGIN + colW * 0.38;
  const c3 = MARGIN + colW * 0.62;
  const rowH = 12;
  const rows = data.courseRowCount ?? DEFAULT_COURSE_ROWS;
  /** Sur pages intermédiaires : seulement le pied légal ; dernière page : + signatures. */
  let bottomLimit = pageHeight - LEGAL_FOOTER_H - 4;

  const drawTableHeader = () => {
    pdf.setFillColor(245, 245, 245);
    pdf.rect(MARGIN, y, colW, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("Dates et durée des cours", c1 + 1, y + 5.5);
    pdf.text(
      kind === "formateur" ? "Nom et prénom du stagiaire" : "Nom et prénom du formateur",
      c2 + 1,
      y + 5.5
    );
    pdf.text(
      kind === "formateur" ? "Signature du formateur" : "Signature du stagiaire",
      c3 + 1,
      y + 5.5
    );
    y += 8;
    pdf.setFont("helvetica", "normal");
  };

  drawTableHeader();

  const nameInRow =
    kind === "formateur" ? data.studentName || "" : data.formateurName || "";

  for (let i = 0; i < rows; i++) {
    const remaining = rows - i;
    // Dernières lignes : laisser la place du bloc signature
    if (remaining <= 3) bottomLimit = pageHeight - BOTTOM_RESERVE_H;
    if (y + rowH > bottomLimit) {
      drawLegalFooter(pdf);
      pdf.addPage();
      y = drawBrandHeader(pdf, kind, logoDataUrl);
      bottomLimit = pageHeight - LEGAL_FOOTER_H - 4;
      drawTableHeader();
    }
    pdf.setDrawColor(180, 180, 180);
    pdf.rect(MARGIN, y, colW, rowH);
    pdf.line(c2, y, c2, y + rowH);
    pdf.line(c3, y, c3, y + rowH);

    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Le ………………", c1 + 2, y + 4.5);
    pdf.text("durée en h : ……", c1 + 2, y + 9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    const nameLines = pdf.splitTextToSize(nameInRow, c3 - c2 - 3);
    pdf.text(nameLines, c2 + 2, y + 5);
    y += rowH;
  }

  return y + 4;
}

function drawSignatureBlock(pdf: jsPDF, kind: PresenceFicheKind, y: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  // Toujours au-dessus du pied légal
  const maxStart = pageHeight - LEGAL_FOOTER_H - SIGNATURE_CONTENT_H;
  y = Math.min(Math.max(y + 3, maxStart - 8), maxStart);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (kind === "stagiaire") {
    pdf.text("Nombre d'heures effectuées au total : ………………", MARGIN, y);
    y += 7;
  } else {
    pdf.text("Total des heures : ………………", MARGIN, y);
    y += 7;
  }
  pdf.text("Fait à ………………                    Le ………………", MARGIN, y);
  y += 7;
  pdf.setFont("helvetica", "bold");
  pdf.text("Signature du responsable pédagogique :", MARGIN, y);
  pdf.setFont("helvetica", "normal");
  pdf.line(MARGIN + 72, y, MARGIN + 150, y);
}

export function buildPresenceFichePdfBlob(
  kind: PresenceFicheKind,
  data: PresenceFicheInput
): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = drawBrandHeader(pdf, kind, data.logoDataUrl);
  y = drawMetaBlock(pdf, kind, data, y);
  y = drawCourseTable(pdf, kind, data, y, data.logoDataUrl);
  drawSignatureBlock(pdf, kind, y);
  // Pied légal sur toutes les pages
  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    drawLegalFooter(pdf);
  }
  return pdf.output("blob");
}

export async function buildPresenceFichePdfBlobAsync(
  kind: PresenceFicheKind,
  data: PresenceFicheInput,
  logoUrl?: string | null
): Promise<Blob> {
  let logoDataUrl = data.logoDataUrl ?? null;
  if (!logoDataUrl && logoUrl) {
    logoDataUrl = await loadImageAsDataUrl(logoUrl);
  }
  return buildPresenceFichePdfBlob(kind, { ...data, logoDataUrl });
}

export function downloadPresenceFichePdf(
  kind: PresenceFicheKind,
  data: PresenceFicheInput,
  code?: string | null
) {
  const blob = buildPresenceFichePdfBlob(kind, data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = presenceFicheFilename(kind, data.studentName, code);
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPresenceFichePdfAsync(
  kind: PresenceFicheKind,
  data: PresenceFicheInput,
  code?: string | null,
  logoUrl?: string | null
) {
  const blob = await buildPresenceFichePdfBlobAsync(kind, data, logoUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = presenceFicheFilename(kind, data.studentName, code);
  a.click();
  URL.revokeObjectURL(url);
}
