import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import fliLogo from "@/assets/fli-logo.png";
import {
  CERTIFICATE_SNMSF_DISCLAIMER,
  OBJECTIF_ATTEINT_LABELS,
  type CertificateBilanData,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";

interface CertificatePreviewProps {
  data: CertificateBilanData;
  onPdfBlob?: (blob: Blob) => void | Promise<void>;
}

export function CertificatePreview({ data, onPdfBlob }: CertificatePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const buildPdf = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!certificateRef.current) return null;
    const canvas = await html2canvas(certificateRef.current, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    } as Parameters<typeof html2canvas>[1]);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const imgX = (pdfWidth - canvas.width * ratio) / 2;
    pdf.addImage(
      imgData,
      "PNG",
      imgX,
      8,
      canvas.width * ratio,
      canvas.height * ratio
    );

    const fileName = `certificat-${data.studentName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${data.inscriptionCode || "formation"}.pdf`;
    return { blob: pdf.output("blob"), fileName };
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const result = await buildPdf();
      if (!result) return;
      if (onPdfBlob) await onPdfBlob(result.blob);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur génération PDF certificat:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const objectifLabel =
    OBJECTIF_ATTEINT_LABELS[data.objectifAtteint as ObjectifAtteint] ||
    data.objectifAtteint;

  const locationLine = data.locationOrModality || "—";
  const hoursLine = `${data.hoursFollowed ?? "—"} h suivies / ${
    data.durationHoursPlanned ?? "—"
  } h prévues`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Télécharger PDF
        </Button>
      </div>

      <div
        ref={certificateRef}
        className="bg-white border border-primary/20 rounded-lg p-10 print:border-none print:p-6 min-h-[700px] flex flex-col text-left"
        id="certificate-pdf"
      >
        <div className="text-center mb-6">
          <img src={fliLogo} alt="FLI" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary tracking-wide uppercase">
            Certificat de fin de formation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">FLI — Foreign Language Immersion</p>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Stagiaire :</span>{" "}
            <span className="font-semibold text-base">{data.studentName}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Formation :</span>{" "}
            {data.language}
            {" · "}
            {format(new Date(data.startDate), "d MMM yyyy", { locale: fr })}
            {" → "}
            {format(new Date(data.endDate), "d MMM yyyy", { locale: fr })}
            {" · "}
            {data.durationHoursPlanned != null
              ? `${data.durationHoursPlanned} h`
              : "durée n/c"}
            {" · "}
            {locationLine}
          </p>
          <p>
            <span className="text-muted-foreground">Formateur·rice :</span>{" "}
            {data.formateurName || "—"}
          </p>
        </div>

        <h2 className="text-lg font-semibold mt-8 mb-3">Bilan de progression</h2>
        <table className="w-full border-collapse text-sm mb-4">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left w-1/3" />
              <th className="border p-2 text-left">Entrée</th>
              <th className="border p-2 text-left">Sortie</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2 font-medium">Niveau général</td>
              <td className="border p-2">{data.niveauGeneralEntree}</td>
              <td className="border p-2">{data.niveauGeneralSortie}</td>
            </tr>
            <tr>
              <td className="border p-2 font-medium">
                Niveau technique / spécifique au métier
              </td>
              <td className="border p-2">{data.niveauTechniqueEntree}</td>
              <td className="border p-2">{data.niveauTechniqueSortie}</td>
            </tr>
          </tbody>
        </table>

        <div className="mb-4 text-sm space-y-1">
          <p>
            <span className="font-medium">Objectif pédagogique atteint :</span>{" "}
            {objectifLabel}
          </p>
          <p className="whitespace-pre-wrap leading-relaxed border-l-2 border-primary/30 pl-3">
            {data.commentaire}
          </p>
        </div>

        <p className="text-xs text-muted-foreground italic leading-relaxed mb-6">
          {CERTIFICATE_SNMSF_DISCLAIMER}
        </p>

        <div className="mt-auto space-y-4 text-sm">
          <p>
            <span className="font-medium">Heures :</span> {hoursLine}
          </p>
          <div className="flex justify-between items-end pt-4">
            <div>
              <p>
                Date :{" "}
                {format(new Date(data.issueDate), "d MMMM yyyy", { locale: fr })}
              </p>
              {data.inscriptionCode ? (
                <p className="text-xs text-muted-foreground">
                  Réf. {data.inscriptionCode}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="font-medium mb-1">Signature FLI</p>
              <div className="w-36 h-14 border-b border-dashed border-muted-foreground/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Exposed for end-pack PDF upload without mounting the full preview UI. */
export async function renderCertificatePdfBlob(
  element: HTMLElement
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
  } as Parameters<typeof html2canvas>[1]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const ratio = Math.min(pdfWidth / canvas.width, pdf.internal.pageSize.getHeight() / canvas.height);
  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    (pdfWidth - canvas.width * ratio) / 2,
    8,
    canvas.width * ratio,
    canvas.height * ratio
  );
  return pdf.output("blob");
}
