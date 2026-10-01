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
};

const DEFAULT_COURSE_ROWS = 15;

export function formatPresenceDate(iso: string | null | undefined): string {
  if (!iso) return "…";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // déjà jj/mm/aaaa ou texte libre
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

function drawHeaderBlock(
  pdf: jsPDF,
  kind: PresenceFicheKind,
  data: PresenceFicheInput,
  margin: number,
  y: number
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(
    kind === "formateur" ? "Fiche de présence — FORMATEUR" : "Fiche de présence — STAGIAIRE",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("FLI — France Langues International", pageWidth / 2, y, { align: "center" });
  y += 8;

  const line = (label: string, value: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label, margin, y);
    pdf.setFont("helvetica", "normal");
    const labelW = pdf.getTextWidth(label);
    pdf.text(value || "—", margin + labelW + 2, y);
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
  line(
    kind === "formateur" ? "Nom et prénom du formateur :" : "Nom et prénom du formateur :",
    data.formateurName || "—"
  );
  y += 3;
  return y;
}

function drawCourseTable(
  pdf: jsPDF,
  kind: PresenceFicheKind,
  data: PresenceFicheInput,
  margin: number,
  y: number
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const colW = pageWidth - margin * 2;
  const c1 = margin;
  const c2 = margin + colW * 0.38;
  const c3 = margin + colW * 0.62;
  const rowH = 12;
  const rows = data.courseRowCount ?? DEFAULT_COURSE_ROWS;

  const drawTableHeader = () => {
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, colW, 8, "F");
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
    if (y + rowH > pageHeight - 28) {
      pdf.addPage();
      y = 16;
      drawTableHeader();
    }
    pdf.setDrawColor(180, 180, 180);
    pdf.rect(margin, y, colW, rowH);
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

function drawFooter(pdf: jsPDF, kind: PresenceFicheKind, margin: number, y: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  y = Math.max(y + 2, pageHeight - 32);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (kind === "stagiaire") {
    pdf.text("Nombre d'heures effectuées au total : ………………", margin, y);
    y += 7;
  } else {
    pdf.text("Total des heures : ………………", margin, y);
    y += 7;
  }
  pdf.text("Fait à ………………                    Le ………………", margin, y);
  y += 7;
  pdf.setFont("helvetica", "bold");
  pdf.text("Signature du responsable pédagogique :", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.line(margin + 72, y, margin + 150, y);
}

export function buildPresenceFichePdfBlob(
  kind: PresenceFicheKind,
  data: PresenceFicheInput
): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = 14;
  y = drawHeaderBlock(pdf, kind, data, margin, y);
  y = drawCourseTable(pdf, kind, data, margin, y);
  drawFooter(pdf, kind, margin, y);
  return pdf.output("blob");
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
