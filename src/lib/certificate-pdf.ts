import jsPDF from "jspdf";
import {
  CERTIFICATE_SNMSF_DISCLAIMER,
  OBJECTIF_ATTEINT_LABELS,
  type CertificateBilanData,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";

/** Génère le PDF certificat sans DOM (end pack / stockage). */
export function buildCertificatePdfBlob(data: CertificateBilanData): Blob {
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
  pdf.text("Certificat de fin de formation", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("FLI — Foreign Language Immersion", pageWidth / 2, y, { align: "center" });
  y += 12;

  line(`Stagiaire : ${data.studentName}`, { bold: true, size: 12 });
  line(
    `Formation : ${data.language} · ${data.startDate} → ${data.endDate} · ${
      data.durationHoursPlanned != null ? `${data.durationHoursPlanned} h` : "durée n/c"
    } · ${data.locationOrModality || "—"}`
  );
  line(`Formateur·rice : ${data.formateurName || "—"}`);
  y += 4;

  line("Bilan de progression", { bold: true, size: 13 });
  line(
    `Niveau général — Entrée : ${data.niveauGeneralEntree} | Sortie : ${data.niveauGeneralSortie}`
  );
  line(
    `Niveau technique — Entrée : ${data.niveauTechniqueEntree} | Sortie : ${data.niveauTechniqueSortie}`
  );
  const objectif =
    OBJECTIF_ATTEINT_LABELS[data.objectifAtteint as ObjectifAtteint] ||
    data.objectifAtteint;
  line(`Objectif pédagogique atteint : ${objectif}`);
  y += 2;
  line(data.commentaire);
  y += 4;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  const disclaimer = pdf.splitTextToSize(CERTIFICATE_SNMSF_DISCLAIMER, maxWidth);
  pdf.text(disclaimer, margin, y);
  y += disclaimer.length * 3.5 + 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  line(
    `Heures : ${data.hoursFollowed ?? "—"} h suivies / ${
      data.durationHoursPlanned ?? "—"
    } h prévues`
  );
  line(`Date : ${data.issueDate}`);
  if (data.inscriptionCode) line(`Réf. : ${data.inscriptionCode}`, { size: 9 });
  y += 10;
  line("Signature FLI", { bold: true });
  pdf.line(margin, y, margin + 50, y);

  return pdf.output("blob");
}
