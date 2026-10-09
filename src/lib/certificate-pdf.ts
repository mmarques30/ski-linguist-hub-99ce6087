/**
 * Certificat d'assiduité et de fin de formation — calqué sur
 * « Certificat 2024.docx », avec en-tête organisme type facture FLI
 * (logo + coordonnées + SIRET / NDA) et pied Version 2.
 */
import { jsPDF } from "jspdf";
import {
  CERTIFICATE_SNMSF_DISCLAIMER,
  OBJECTIF_ATTEINT_LABELS,
  type CertificateBilanData,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";
import { INSCRIPTION_DOCUMENT_ASSET_FILES } from "@/lib/inscription-documents-assets";

const MARGIN = 18;

const LETTERHEAD_PUBLIC_PATH = `inscription-documents/${INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead}`;
const CACHET_PUBLIC_PATH = `inscription-documents/${INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature}`;

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

const FOOTER_H = 22;

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

async function loadPublicPngBytes(
  publicRelativePath: string,
  override?: Uint8Array | null
): Promise<Uint8Array | null> {
  if (override && override.byteLength > 0) return override;

  if (typeof globalThis.fetch === "function") {
    try {
      const res = await fetch(`/${publicRelativePath}`);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch {
      /* Node / hors Vite */
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
  return loadPublicPngBytes(LETTERHEAD_PUBLIC_PATH, override);
}

function drawFliFooter(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = pageHeight - FOOTER_H;
  pdf.setDrawColor(128, 128, 128);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, y - 3, pageWidth - MARGIN, y - 3);
  pdf.setTextColor(127, 127, 127);
  CERTIFICATE_FLI_FOOTER_LINES.forEach((text, i) => {
    pdf.setFont("helvetica", i === 0 ? "bold" : "normal");
    pdf.setFontSize(7);
    pdf.text(text, pageWidth / 2, y, { align: "center" });
    y += 3.4;
  });
  pdf.setTextColor(0, 0, 0);
}

/**
 * En-tête type facture : logo à gauche + coordonnées organisme.
 * Retourne le y sous le bloc.
 */
function drawOrgHeader(
  pdf: jsPDF,
  letterhead: Uint8Array | null,
  pageWidth: number
): number {
  const top = 10;
  let logoBottom = top;

  if (letterhead?.byteLength) {
    try {
      const logoW = 58;
      const logoH = 25;
      pdf.addImage(letterhead, "PNG", MARGIN, top, logoW, logoH);
      logoBottom = top + logoH;
    } catch {
      /* texte seul */
    }
  }

  const textX = MARGIN;
  let ty = logoBottom + 3;
  pdf.setTextColor(40, 40, 40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(CERTIFICATE_ORG.name, textX, ty);
  ty += 4.2;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(70, 70, 70);
  for (const line of [
    CERTIFICATE_ORG.address,
    CERTIFICATE_ORG.cityLine,
    `Tél. ${CERTIFICATE_ORG.phone}  ·  ${CERTIFICATE_ORG.email}`,
    `SIRET ${CERTIFICATE_ORG.siret}`,
    `Organisme de formation n° ${CERTIFICATE_ORG.activityNumber}`,
  ]) {
    pdf.text(line, textX, ty);
    ty += 3.6;
  }
  pdf.setTextColor(0, 0, 0);

  // Filet sous l'en-tête
  const ruleY = Math.max(ty, logoBottom) + 3;
  pdf.setDrawColor(252, 175, 23); // jaune FLI
  pdf.setLineWidth(0.8);
  pdf.line(MARGIN, ruleY, pageWidth - MARGIN, ruleY);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);

  return ruleY + 8;
}

export type BuildCertificatePdfOptions = {
  letterheadPng?: Uint8Array | null;
  cachetPng?: Uint8Array | null;
};

/** Génère le PDF certificat (modèle Word 2024) pour end pack / stockage. */
export async function buildCertificatePdfBlob(
  data: CertificateBilanData,
  options?: BuildCertificatePdfOptions
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - MARGIN * 2;

  const [letterhead, cachet] = await Promise.all([
    loadCertificateLetterheadBytes(options?.letterheadPng),
    loadPublicPngBytes(CACHET_PUBLIC_PATH, options?.cachetPng),
  ]);

  let y = drawOrgHeader(pdf, letterhead, pageWidth);

  const line = (
    text: string,
    opts?: { bold?: boolean; size?: number; indent?: number }
  ) => {
    const size = opts?.size ?? 10;
    pdf.setFont("helvetica", opts?.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const x = MARGIN + (opts?.indent ?? 0);
    const width = maxWidth - (opts?.indent ?? 0);
    const lines = pdf.splitTextToSize(text, width);
    pdf.text(lines, x, y);
    y += lines.length * (size * 0.42) + 2.2;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("Certificat d'assiduité et de fin de formation", pageWidth / 2, y, {
    align: "center",
  });
  y += 9;

  line("Pour servir ce que de droit,", { size: 10 });
  y += 1;
  line(
    `Je soussignée ${CERTIFICATE_ORG.representative}, responsable de ${CERTIFICATE_ORG.name}, atteste que :`,
    { size: 10 }
  );
  y += 2;

  line(
    `${data.studentName} a suivi ${formationPhrase(
      data.language,
      data.locationOrModality
    )}.`,
    { bold: true, size: 11 }
  );
  y += 2;

  const start = formatFrDate(data.startDate);
  const end = formatFrDate(data.endDate);
  line(`Dates de la formation : du ${start} au ${end}.`);
  const hours = data.hoursFollowed ?? data.durationHoursPlanned;
  line(
    `Durée de la formation : ${hours != null ? `${hours} heures` : "…"}.`
  );
  line(`Lieu de la formation : ${formatLieu(data.locationOrModality)}.`);
  if (data.formateurName) {
    line(`Formateur·rice : ${data.formateurName}.`);
  }
  y += 3;

  line("Niveaux atteints à la fin de la formation :", { bold: true });
  line(`Langue générale : ${data.niveauGeneralSortie}.`, { indent: 6 });
  line(`Langage technique : ${data.niveauTechniqueSortie}.`, { indent: 6 });
  y += 2;

  line("Bilan de progression (entrée -> sortie)", { bold: true, size: 10 });
  line(
    `Niveau général — Entrée : ${data.niveauGeneralEntree}  |  Sortie : ${data.niveauGeneralSortie}`,
    { size: 9, indent: 4 }
  );
  line(
    `Niveau technique — Entrée : ${data.niveauTechniqueEntree}  |  Sortie : ${data.niveauTechniqueSortie}`,
    { size: 9, indent: 4 }
  );
  const objectif =
    OBJECTIF_ATTEINT_LABELS[data.objectifAtteint as ObjectifAtteint] ||
    data.objectifAtteint;
  line(`Objectif pédagogique atteint : ${objectif}`, { size: 9, indent: 4 });
  if (data.commentaire?.trim()) {
    y += 1;
    line(data.commentaire.trim(), { size: 9, indent: 4 });
  }
  y += 3;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  const disclaimer = pdf.splitTextToSize(CERTIFICATE_SNMSF_DISCLAIMER, maxWidth);
  pdf.text(disclaimer, MARGIN, y);
  y += disclaimer.length * 3.3 + 5;

  line(
    "En conséquence de quoi le présent certificat lui est délivré pour servir ce que de droit."
  );
  y += 3;
  line(`Fait à Montmélian, le ${formatFrDate(data.issueDate)}.`);
  if (data.inscriptionCode) {
    line(`Réf. inscription : ${data.inscriptionCode}`, { size: 8 });
  }
  y += 8;

  const colLeft = MARGIN + 8;
  const colRight = pageWidth / 2 + 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("La stagiaire", colLeft, y);
  pdf.text("F.L.I.", colRight, y);
  y += 5;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(CERTIFICATE_ORG.signatory, colRight, y);

  if (cachet?.byteLength) {
    try {
      const cachetW = 42;
      const cachetH = 25;
      pdf.addImage(cachet, "PNG", colRight, y + 2, cachetW, cachetH);
    } catch {
      /* cachet optionnel */
    }
  }

  drawFliFooter(pdf);

  return pdf.output("blob");
}
