/**
 * Contrat + fiches présence Hugo Maulaz / Maxime Goy (FLI-260112).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const require = createRequire(import.meta.url);
const { jsPDF } = require("jspdf");

const OUT = "/opt/cursor/artifacts/hugo-maxime-2026-11-03";
mkdirSync(OUT, { recursive: true });

const CONTRACT_NUMBER = process.env.CONTRACT_NUMBER || "CTR-2026-0006";
const HOURS = 18;
const RATE = 30;
const TOTAL = HOURS * RATE;

const DEFAULT_COURSE_ROWS = 12;
const MARGIN = 14;
const LEGAL_FOOTER_H = 18;
const SIGNATURE_CONTENT_H = 24;
const BOTTOM_RESERVE_H = LEGAL_FOOTER_H + SIGNATURE_CONTENT_H + 4;
const FLI_PRESENCE_FOOTER_LINES = [
  "Formation Professionnelle Continue : Langues Etrangères",
  "SARL au capital de 5000 euros. F.L.I. 25 avenue de la gare, 73800 Montmélian",
  "Siret : 484 772 041 00048- RCS Chambéry – NAF : 8559A - Organisme de formation n° 82 73 01366 73",
] as const;

function formatPresenceDate(iso: string | null | undefined): string {
  if (!iso) return "…";
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, day] = iso.slice(0, 10).split("-");
    return `${Number(day)}/${Number(m)}/${y}`;
  }
  return iso;
}

function presenceFormationTitle(kind: "formateur" | "stagiaire", language: string): string {
  const lang = (language || "…").trim();
  if (kind === "formateur") return `formation individualisée ${lang}`;
  return `Formation en ligne individuelle en ${lang}.`;
}

function presenceFicheFilename(
  kind: "formateur" | "stagiaire",
  studentName: string,
  code?: string | null,
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

type PresenceInput = {
  language: string;
  startDate: string;
  endDate: string;
  durationHours: number;
  locationLabel: string;
  studentName: string;
  formateurName: string;
  studentPostalCode?: string | null;
  studentCity?: string | null;
  logoDataUrl?: string | null;
  courseRowCount?: number;
};

function buildPresenceFichePdfBytes(
  kind: "formateur" | "stagiaire",
  data: PresenceInput,
): Uint8Array {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const drawLegalFooter = () => {
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
  };

  const drawBrandHeader = () => {
    let y = 10;
    if (data.logoDataUrl) {
      try {
        const logoW = 48;
        const logoH = 18;
        pdf.addImage(data.logoDataUrl, "PNG", (pageWidth - logoW) / 2, y, logoW, logoH);
        y += logoH + 4;
      } catch {
        /* ignore */
      }
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(
      kind === "formateur" ? "Fiche de présence — FORMATEUR" : "Fiche de présence — STAGIAIRE",
      pageWidth / 2,
      y,
      { align: "center" },
    );
    return y + 7;
  };

  let y = drawBrandHeader();

  const metaLine = (label: string, value: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(label, MARGIN, y);
    pdf.setFont("helvetica", "normal");
    const labelW = pdf.getTextWidth(label);
    pdf.text(value || "—", MARGIN + labelW + 2, y);
    y += 5.5;
  };
  metaLine("Intitulé de la formation :", presenceFormationTitle(kind, data.language));
  metaLine(
    "Dates de la formation :",
    `Du ${formatPresenceDate(data.startDate)} au ${formatPresenceDate(data.endDate)}`,
  );
  metaLine("Durée du pack :", `${data.durationHours} heures`);
  if (kind === "stagiaire") {
    const cp = (data.studentPostalCode || "").trim();
    const city = (data.studentCity || "").trim();
    const place =
      data.locationLabel.toLowerCase().includes("ligne") || !data.locationLabel
        ? `En ligne : ${[cp, city].filter(Boolean).join(" ") || "…"}`
        : data.locationLabel;
    metaLine("Lieu :", place);
  } else {
    metaLine("Lieu :", data.locationLabel || "En ligne");
  }
  metaLine("Nom du stagiaire :", data.studentName || "—");
  metaLine("Nom et prénom du formateur :", data.formateurName || "—");
  y += 3;

  const colW = pageWidth - MARGIN * 2;
  const c1 = MARGIN;
  const c2 = MARGIN + colW * 0.38;
  const c3 = MARGIN + colW * 0.62;
  const rowH = 12;
  const rows = data.courseRowCount ?? DEFAULT_COURSE_ROWS;
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
      y + 5.5,
    );
    pdf.text(
      kind === "formateur" ? "Signature du formateur" : "Signature du stagiaire",
      c3 + 1,
      y + 5.5,
    );
    y += 8;
    pdf.setFont("helvetica", "normal");
  };
  drawTableHeader();

  const nameInRow = kind === "formateur" ? data.studentName || "" : data.formateurName || "";
  for (let i = 0; i < rows; i++) {
    const remaining = rows - i;
    if (remaining <= 3) bottomLimit = pageHeight - BOTTOM_RESERVE_H;
    if (y + rowH > bottomLimit) {
      drawLegalFooter();
      pdf.addPage();
      y = drawBrandHeader();
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
    const nameLines = pdf.splitTextToSize(nameInRow, c3 - c2 - 3);
    pdf.text(nameLines, c2 + 2, y + 5);
    y += rowH;
  }
  y += 4;

  const maxStart = pageHeight - LEGAL_FOOTER_H - SIGNATURE_CONTENT_H;
  y = Math.min(Math.max(y + 3, maxStart - 8), maxStart);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    kind === "stagiaire"
      ? "Nombre d'heures effectuées au total : ………………"
      : "Total des heures : ………………",
    MARGIN,
    y,
  );
  y += 7;
  pdf.text("Fait à ………………                    Le ………………", MARGIN, y);
  y += 7;
  pdf.setFont("helvetica", "bold");
  pdf.text("Signature du responsable pédagogique :", MARGIN, y);
  pdf.line(MARGIN + 72, y, MARGIN + 150, y);

  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    drawLegalFooter();
  }
  return new Uint8Array(pdf.output("arraybuffer"));
}

async function buildContractPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0.07, 0.07, 0.07);
  let y = 800;
  const left = 50;
  const width = 495;
  const line = (text: string, size = 10, f = font) => {
    page.drawText(text, { x: left, y, size, font: f, color: black });
    y -= size + 4;
  };
  const para = (text: string, size = 9.5) => {
    const words = text.split(/\s+/);
    let row = "";
    for (const w of words) {
      const trial = row ? `${row} ${w}` : w;
      if (font.widthOfTextAtSize(trial, size) > width) {
        page.drawText(row, { x: left, y, size, font, color: black });
        y -= size + 3;
        row = w;
      } else row = trial;
    }
    if (row) {
      page.drawText(row, { x: left, y, size, font, color: black });
      y -= size + 3;
    }
    y -= 4;
  };

  line("CONTRAT DE PRESTATION DE FORMATION", 14, bold);
  line(`N° ${CONTRACT_NUMBER}`, 11, bold);
  y -= 6;
  line("Entre les soussignés :", 10, bold);
  para(
    "France Langues International (F.L.I.), SARL au capital de 5 000 euros, 25 avenue de la Gare, 73800 Montmélian — SIRET 484 772 041 00048 — RCS Chambéry — Organisme de formation n° 82 73 01366 73, représentée par Paula Rangel-Halbwachs, gérante, ci-après « l'Organisme »,",
  );
  para(
    "Et Monsieur Maxime Goy, auto-entrepreneur, SIRET 930 409 925 00029, 2232 route du col des Aravis, 73590 La Giettaz — maxime.goy12@gmail.com — 06 58 41 11 46, ci-après « le Prestataire »,",
  );
  para("Il a été convenu ce qui suit :");
  line("Article 1 — Objet", 10, bold);
  para(
    "Le Prestataire s'engage à assurer une formation individualisée d'anglais en ligne (Google Meet) pour le compte de l'Organisme.",
  );
  line("Article 2 — Stagiaire et volume", 10, bold);
  para(
    "Stagiaire : Hugo Maulaz (hugo.maulaz@icloud.com — 07 71 87 26 08). Dossier FLI-260112. Volume : 18 heures. Période : du 03/11/2026 au 26/11/2026 (créneaux à convenir ; 1er cours prévu le 3 novembre 2026). Les créneaux sont convenus directement entre le Prestataire et le stagiaire.",
  );
  line("Article 3 — Rémunération", 10, bold);
  para(
    `Rémunération : ${RATE} € HT par heure, soit ${HOURS} h × ${RATE} € = ${TOTAL} € HT. Le Prestataire adressera sa facture à l'Organisme en fin de mission, accompagnée de la fiche de présence FORMATEUR signée.`,
  );
  line("Article 4 — Exécution", 10, bold);
  para(
    "Le Prestataire contacte le stagiaire pour organiser les cours, fait signer la fiche de présence à chaque séance, et renvoie la fiche signée à info@fli.fr en fin de formation.",
  );
  line("Article 5 — Annulation / absence", 10, bold);
  para(
    "Toute séance annulée par le stagiaire moins de 24 h à l'avance, ou toute absence non justifiée, reste due au Prestataire.",
  );
  line("Article 6 — Statut", 10, bold);
  para(
    "Le Prestataire agit en toute indépendance. Le présent contrat ne crée aucun lien de subordination. Il est seul responsable de ses obligations fiscales et sociales.",
  );
  y -= 8;
  para(`Fait à Montmélian, le ${new Date().toLocaleDateString("fr-FR")}.`);
  y -= 10;
  page.drawText("Pour l'Organisme", { x: left, y, size: 9, font: bold, color: black });
  page.drawText("Le Prestataire", { x: 320, y, size: 9, font: bold, color: black });
  y -= 14;
  page.drawText("Paula Rangel-Halbwachs", { x: left, y, size: 9, font, color: black });
  page.drawText("Maxime Goy", { x: 320, y, size: 9, font, color: black });
  y -= 12;
  page.drawText("Lu et approuvé", { x: left, y, size: 8, font, color: black });
  page.drawText("Lu et approuvé", { x: 320, y, size: 8, font, color: black });
  return doc.save();
}

async function main() {
  const logoBuf = readFileSync("/workspace/public/presence-fiches/fli-header-logo.png");
  const logoDataUrl = `data:image/png;base64,${logoBuf.toString("base64")}`;
  const input: PresenceInput = {
    language: "Anglais",
    startDate: "2026-11-03",
    endDate: "2026-11-26",
    durationHours: HOURS,
    locationLabel: "En ligne",
    studentName: "Hugo Maulaz",
    formateurName: "Maxime Goy",
    studentPostalCode: "74200",
    studentCity: "Thonon-les-Bains",
    logoDataUrl,
  };

  const contractBytes = await buildContractPdf();
  const contractPath = join(OUT, `Contrat-${CONTRACT_NUMBER}-Maxime-Goy.pdf`);
  writeFileSync(contractPath, contractBytes);

  const formateurName = presenceFicheFilename("formateur", input.studentName, "FLI-260112");
  const stagiaireName = presenceFicheFilename("stagiaire", input.studentName, "FLI-260112");
  writeFileSync(join(OUT, formateurName), buildPresenceFichePdfBytes("formateur", input));
  writeFileSync(join(OUT, stagiaireName), buildPresenceFichePdfBytes("stagiaire", input));

  console.log(
    JSON.stringify(
      {
        contractPath,
        formateurPath: join(OUT, formateurName),
        stagiairePath: join(OUT, stagiaireName),
        contractNumber: CONTRACT_NUMBER,
        hours: HOURS,
        rate: RATE,
        total: TOTAL,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
