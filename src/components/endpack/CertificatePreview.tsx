import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  CERTIFICATE_SNMSF_DISCLAIMER,
  OBJECTIF_ATTEINT_LABELS,
  type CertificateBilanData,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";
import {
  buildCertificatePdfBlob,
  CERTIFICATE_ASSET_FILES,
  CERTIFICATE_FLI_FOOTER_LINES,
  CERTIFICATE_ORG,
} from "@/lib/certificate-pdf";

interface CertificatePreviewProps {
  data: CertificateBilanData;
  onPdfBlob?: (blob: Blob) => void | Promise<void>;
}

const LETTERHEAD_SRC = `/inscription-documents/${CERTIFICATE_ASSET_FILES.letterhead}`;
const CACHET_SRC = `/inscription-documents/${CERTIFICATE_ASSET_FILES.cachet}`;

export function CertificatePreview({ data, onPdfBlob }: CertificatePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await buildCertificatePdfBlob(data);
      if (onPdfBlob) await onPdfBlob(blob);
      const fileName = `certificat-${data.studentName
        .replace(/\s+/g, "-")
        .toLowerCase()}-${data.inscriptionCode || "formation"}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
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
  const hoursLine = `${data.hoursFollowed ?? data.durationHoursPlanned ?? "—"} heures`;

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
        <div className="mb-4">
          <img
            src={LETTERHEAD_SRC}
            alt={CERTIFICATE_ORG.name}
            className="h-16 w-auto object-contain mb-3"
          />
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-semibold text-foreground">{CERTIFICATE_ORG.name}</p>
            <p>{CERTIFICATE_ORG.address}</p>
            <p>{CERTIFICATE_ORG.cityLine}</p>
            <p>
              Tél. {CERTIFICATE_ORG.phone} · {CERTIFICATE_ORG.email}
            </p>
            <p>SIRET {CERTIFICATE_ORG.siret}</p>
            <p>Organisme de formation n° {CERTIFICATE_ORG.activityNumber}</p>
          </div>
          <div className="mt-3 h-1 w-full bg-[#FCAF17]" />
        </div>

        <h1 className="text-xl font-bold text-center tracking-wide mb-6">
          Certificat d&apos;assiduité et de fin de formation
        </h1>

        <div className="space-y-3 text-sm leading-relaxed">
          <p>Pour servir ce que de droit,</p>
          <p>
            Je soussignée {CERTIFICATE_ORG.representative}, responsable de{" "}
            {CERTIFICATE_ORG.name}, atteste que&nbsp;:
          </p>
          <p className="font-semibold text-base">
            {data.studentName} a suivi une formation individualisée en{" "}
            {data.language}.
          </p>
          <p>
            Dates de la formation : du{" "}
            {format(new Date(data.startDate), "dd/MM/yyyy")} au{" "}
            {format(new Date(data.endDate), "dd/MM/yyyy")}.
          </p>
          <p>Durée de la formation : {hoursLine}.</p>
          <p>Lieu de la formation : {locationLine}.</p>
          {data.formateurName ? (
            <p>Formateur·rice : {data.formateurName}.</p>
          ) : null}
        </div>

        <Separator className="my-5" />

        <div className="space-y-2 text-sm mb-4">
          <p className="font-semibold">Niveaux atteints à la fin de la formation :</p>
          <p className="pl-4">Langue générale : {data.niveauGeneralSortie}.</p>
          <p className="pl-4">Langage technique : {data.niveauTechniqueSortie}.</p>
        </div>

        <h2 className="text-sm font-semibold mb-2">
          {"Bilan de progression (entrée -> sortie)"}
        </h2>
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

        <p className="text-sm mb-4">
          En conséquence de quoi le présent certificat lui est délivré pour servir
          ce que de droit.
        </p>

        <div className="mt-auto space-y-6 text-sm">
          <p>
            Fait à Montmélian, le{" "}
            {format(new Date(data.issueDate), "d MMMM yyyy", { locale: fr })}.
          </p>
          {data.inscriptionCode ? (
            <p className="text-xs text-muted-foreground">
              Réf. {data.inscriptionCode}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-8 pt-2">
            <div>
              <p>La stagiaire</p>
            </div>
            <div>
              <p>F.L.I.</p>
              <p className="font-semibold mt-2">{CERTIFICATE_ORG.signatory}</p>
              <img
                src={CACHET_SRC}
                alt="Cachet FLI"
                className="mt-2 h-16 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 pt-3 border-t border-muted-foreground/40 text-center text-[10px] text-muted-foreground leading-snug">
          {CERTIFICATE_FLI_FOOTER_LINES.map((line) => (
            <p
              key={line}
              className={line.startsWith("Formation") ? "font-semibold" : undefined}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Exposed for end-pack PDF upload without mounting the full preview UI. */
export async function renderCertificatePdfBlob(
  data: CertificateBilanData
): Promise<Blob> {
  return buildCertificatePdfBlob(data);
}
