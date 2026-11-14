/**
 * PDF contrat de prestation formateur (individuel en ligne).
 * Signature organisme : cachet FLI + signature Paula (`fli-signature-cachet.png`).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { FLI_ACTIVITY_NUMBER } from "@/lib/organization-identity";

export const FORMATEUR_CONTRACT_SIGNATURE_ASSET =
  "formateur-contracts/fli-signature-cachet.png" as const;

/** Même fichier que les conventions stagiaire (copie canonique inscription-documents). */
export const FORMATEUR_CONTRACT_SIGNATURE_FALLBACK =
  "inscription-documents/fli-signature-cachet.png" as const;

export type InstructorContractPdfInput = {
  contractNumber: string;
  /** Ex. « Madame Tatiana Samoilova-Magnier » / « Monsieur Tulio … » */
  prestataireLine: string;
  /** Ex. « russe », « portugais » */
  languageLabel: string;
  studentFullName: string;
  studentEmail: string;
  studentPhone?: string | null;
  inscriptionCode: string;
  durationHours: number;
  hourlyRate: number;
  /** ISO yyyy-mm-dd */
  startDate: string;
  endDate: string;
  locationLabel?: string | null;
  /** PNG bytes du cachet + signature organisme */
  organismSignaturePng: Uint8Array;
  /** Date d’émission affichée (défaut : aujourd’hui fr-FR) */
  issuedAtLabel?: string | null;
};

export function formatContractDateFr(iso: string | null | undefined): string {
  if (!iso) return "…";
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, day] = iso.slice(0, 10).split("-");
    return `${Number(day)}/${Number(m)}/${y}`;
  }
  return iso;
}

export function instructorContractFilename(
  contractNumber: string,
  formateurLastNameHint?: string | null,
): string {
  const who = (formateurLastNameHint || "formateur")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `Contrat-${contractNumber}-${who}.pdf`;
}

export async function buildInstructorContractPdf(
  input: InstructorContractPdfInput,
): Promise<Uint8Array> {
  const hours = Number(input.durationHours);
  const rate = Number(input.hourlyRate);
  const total = hours * rate;
  const location = (input.locationLabel || "En ligne (Google Meet)").trim();
  const issued =
    input.issuedAtLabel?.trim() ||
    new Date().toLocaleDateString("fr-FR");

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0.07, 0.07, 0.07);
  let y = 800;
  const left = 50;
  const width = 495;

  const line = (text: string, size = 10, f: PDFFont = font) => {
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
  line(`N° ${input.contractNumber}`, 11, bold);
  y -= 6;
  line("Entre les soussignés :", 10, bold);
  para(
    `France Langues International (F.L.I.), SARL au capital de 5 000 euros, 25 avenue de la Gare, 73800 Montmélian — SIRET 484 772 041 00048 — RCS Chambéry — Organisme de formation n° ${FLI_ACTIVITY_NUMBER}, représentée par Paula Rangel-Halbwachs, gérante, ci-après « l'Organisme »,`,
  );
  para(
    `Et ${input.prestataireLine}, ci-après « le Prestataire »,`,
  );
  para("Il a été convenu ce qui suit :");
  line("Article 1 — Objet", 10, bold);
  para(
    `Le Prestataire s'engage à assurer une formation individualisée de ${input.languageLabel.trim().toLowerCase()} en ligne (${location}) pour le compte de l'Organisme.`,
  );
  line("Article 2 — Stagiaire et volume", 10, bold);
  const phone = input.studentPhone?.trim()
    ? ` — ${input.studentPhone.trim()}`
    : "";
  para(
    `Stagiaire : ${input.studentFullName} (${input.studentEmail}${phone}). Dossier ${input.inscriptionCode}. Volume : ${hours} heures. Période : du ${formatContractDateFr(input.startDate)} au ${formatContractDateFr(input.endDate)} (créneaux à convenir). Les créneaux sont convenus directement entre le Prestataire et le stagiaire.`,
  );
  line("Article 3 — Rémunération", 10, bold);
  para(
    `Rémunération : ${rate} € HT par heure, soit ${hours} h × ${rate} € = ${total} € HT. Le Prestataire adressera sa facture à l'Organisme en fin de mission, accompagnée de la fiche de présence FORMATEUR signée.`,
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
  para(`Fait à Montmélian, le ${issued}.`);
  y -= 10;

  page.drawText("Pour l'Organisme", { x: left, y, size: 9, font: bold, color: black });
  page.drawText("Le Prestataire", { x: 320, y, size: 9, font: bold, color: black });
  y -= 14;
  page.drawText("Paula Rangel-Halbwachs", { x: left, y, size: 9, font, color: black });
  page.drawText("Lu et approuvé", { x: 320, y, size: 8, font, color: black });
  y -= 6;

  await drawOrganismSignature(page, input.organismSignaturePng, left, y);

  return doc.save();
}

async function drawOrganismSignature(
  page: PDFPage,
  pngBytes: Uint8Array,
  x: number,
  topY: number,
): Promise<void> {
  const png = await page.doc.embedPng(pngBytes);
  const maxW = 160;
  const scale = maxW / png.width;
  const w = maxW;
  const h = png.height * scale;
  // topY is baseline of previous text; place image below with small gap
  const y = topY - h - 4;
  page.drawImage(png, { x, y: Math.max(40, y), width: w, height: h });
}
