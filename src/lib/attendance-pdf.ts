import jsPDF from "jspdf";
import {
  ATTENDANCE_DAY_PART_LABELS,
  ATTENDANCE_RECORD_LABELS,
  formatSignedElectronically,
  type AttendanceDayPart,
  type AttendanceRecordStatus,
} from "@/lib/attendance";

export type AttendancePdfRow = {
  studentName: string;
  status: AttendanceRecordStatus;
  signedAt?: string | null;
  note?: string | null;
};

export type AttendancePdfInput = {
  title: string;
  slotDate: string;
  dayPart: AttendanceDayPart;
  instructorName?: string | null;
  location?: string | null;
  rows: AttendancePdfRow[];
  instructorValidatedAt?: string | null;
  adminValidatedAt?: string | null;
};

/** Feuille d’émargement type papier (grille signatures). */
export function buildAttendanceSheetPdfBlob(data: AttendancePdfInput): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 16;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("Feuille d'émargement", pageWidth / 2, y, { align: "center" });
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("FLI — Foreign Language Immersion", pageWidth / 2, y, { align: "center" });
  y += 10;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.title || "Session", margin, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  const dayLabel =
    data.dayPart === "custom"
      ? ATTENDANCE_DAY_PART_LABELS.custom
      : ATTENDANCE_DAY_PART_LABELS[data.dayPart];
  pdf.text(`Date : ${data.slotDate}  ·  Créneau : ${dayLabel}`, margin, y);
  y += 5;
  if (data.location) {
    pdf.text(`Lieu : ${data.location}`, margin, y);
    y += 5;
  }
  if (data.instructorName) {
    pdf.text(`Formateur·rice : ${data.instructorName}`, margin, y);
    y += 5;
  }
  y += 4;

  const colName = margin;
  const colStatus = margin + 70;
  const colSign = margin + 100;
  const colW = pageWidth - margin * 2;

  const drawHeader = () => {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y - 4, colW, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("Stagiaire", colName, y);
    pdf.text("Statut", colStatus, y);
    pdf.text("Signature", colSign, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
  };

  drawHeader();

  for (const row of data.rows) {
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = 16;
      drawHeader();
    }
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y + 4, pageWidth - margin, y + 4);
    pdf.setFontSize(9);
    pdf.text(row.studentName || "—", colName, y);
    pdf.text(ATTENDANCE_RECORD_LABELS[row.status] || row.status, colStatus, y);
    const signText =
      row.status === "present"
        ? formatSignedElectronically(row.signedAt)
        : row.status === "pending"
          ? ""
          : ATTENDANCE_RECORD_LABELS[row.status];
    const lines = pdf.splitTextToSize(signText, pageWidth - margin - colSign);
    pdf.text(lines, colSign, y);
    y += Math.max(8, lines.length * 4 + 3);
  }

  y = Math.max(y + 10, pageHeight - 45);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Signature formateur·rice", margin, y);
  pdf.text("Contre-signature responsable", pageWidth / 2, y);
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  if (data.instructorValidatedAt) {
    pdf.text(
      `Validé le ${new Date(data.instructorValidatedAt).toLocaleString("fr-FR")}`,
      margin,
      y
    );
  } else {
    pdf.line(margin, y + 10, margin + 60, y + 10);
  }
  if (data.adminValidatedAt) {
    pdf.text(
      `Contre-signé le ${new Date(data.adminValidatedAt).toLocaleString("fr-FR")}`,
      pageWidth / 2,
      y
    );
  } else {
    pdf.line(pageWidth / 2, y + 10, pageWidth / 2 + 60, y + 10);
  }

  return pdf.output("blob");
}

export function downloadAttendanceSheetPdf(data: AttendancePdfInput, filename?: string) {
  const blob = buildAttendanceSheetPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `emargement-${data.slotDate}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
