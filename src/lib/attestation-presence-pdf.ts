/**
 * Attestation de présence — document FIF-PL de fin de formation
 * (dossier de remboursement avec certificat + facture).
 */
import { jsPDF } from "jspdf";
import { fliDocumentFooterLines } from "@/lib/organization-identity";

export interface AttestationPresenceData {
  studentName: string;
  language: string;
  startDate: string;
  endDate: string;
  durationHoursPlanned: number | null;
  hoursFollowed: number | null;
  attendanceRate: number | null;
  locationOrModality: string | null;
  formateurName: string | null;
  inscriptionCode?: string | null;
  issueDate: string;
  /** Ex. FIFPL — mentionné dans le corps si présent. */
  fundingOrganization?: string | null;
}

export function attestationPresenceFilename(codeOrId: string): string {
  const safe = String(codeOrId || "inscription")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `Attestation-presence-${safe}.pdf`;
}

export function buildAttestationPresencePath(
  studentId: string,
  inscriptionId: string,
  codeOrId: string
): string {
  return `${studentId}/${inscriptionId}/${attestationPresenceFilename(codeOrId)}`;
}

/** PDF attestation de présence (jsPDF / Helvetica). */
export function buildAttestationPresencePdfBlob(
  data: AttestationPresenceData
): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 18;
  let y = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  const line = (text: string, opts?: { bold?: boolean; size?: number }) => {
    pdf.setFont("helvetica", opts?.bold ? "bold" : "normal");
    pdf.setFontSize(opts?.size ?? 11);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, margin, y);
    y += lines.length * ((opts?.size ?? 11) * 0.45) + 2;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Attestation de présence", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("FLI — France Langues International", pageWidth / 2, y, {
    align: "center",
  });
  y += 12;

  line(
    "L'organisme de formation France Langues International (F.L.I.), SIRET 484 772 041 00048, organisme de formation n° 82 73 01 366 73, 25 avenue de la Gare, 73800 Montmélian, atteste que :"
  );
  y += 2;
  line(`Stagiaire : ${data.studentName}`, { bold: true, size: 12 });
  y += 2;
  line(
    `a suivi la formation professionnelle continue de langue ${data.language}, dispensée du ${data.startDate} au ${data.endDate}${
      data.locationOrModality ? ` (${data.locationOrModality})` : ""
    }.`
  );
  y += 2;

  const planned =
    data.durationHoursPlanned != null ? `${data.durationHoursPlanned} h` : "n/c";
  const followed =
    data.hoursFollowed != null ? `${data.hoursFollowed} h` : "n/c";
  line(`Durée prévue : ${planned}`);
  line(`Heures effectivement suivies : ${followed}`);
  if (data.attendanceRate != null) {
    line(`Taux d'assiduité : ${data.attendanceRate} %`);
  }
  if (data.formateurName) {
    line(`Formateur·rice : ${data.formateurName}`);
  }
  if (data.inscriptionCode) {
    line(`Référence inscription : ${data.inscriptionCode}`, { size: 9 });
  }
  if (data.fundingOrganization) {
    line(
      `Document destiné au dossier de remboursement ${data.fundingOrganization}.`,
      { size: 10 }
    );
  }

  y += 4;
  line(
    "La présente attestation est délivrée pour servir et valoir ce que de droit."
  );
  y += 6;
  line(`Fait à Montmélian, le ${data.issueDate}`);
  y += 10;
  line("Signature et cachet de l'organisme", { bold: true });
  pdf.line(margin, y, margin + 50, y);
  y += 14;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  for (const footer of fliDocumentFooterLines(4)) {
    const lines = pdf.splitTextToSize(footer, maxWidth);
    pdf.text(lines, margin, y);
    y += lines.length * 3.2 + 1;
  }

  return pdf.output("blob");
}
