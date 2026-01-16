import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download } from "lucide-react";
import fliLogo from "@/assets/fli-logo.png";

interface CertificatePreviewProps {
  data: {
    studentName: string;
    language: string;
    levelAchieved: string;
    attendanceRate: number;
    startDate: string;
    endDate: string;
    durationHours: number;
    issueDate: string;
    inscriptionCode?: string;
  };
}

export function CertificatePreview({ data }: CertificatePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Télécharger PDF
        </Button>
      </div>

      {/* Certificate Content */}
      <div 
        className="bg-white border-4 border-double border-primary/20 rounded-lg p-12 print:border-none print:p-8 min-h-[600px] flex flex-col"
        id="certificate-pdf"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <img src={fliLogo} alt="FLI Logo" className="h-20 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-primary tracking-wide uppercase">
            Certificat de Formation
          </h1>
          <p className="text-muted-foreground mt-2">
            Attestation de réalisation de formation professionnelle
          </p>
        </div>

        <Separator className="my-6" />

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center text-center space-y-6">
          <p className="text-lg text-muted-foreground">
            Nous certifions que
          </p>
          
          <h2 className="text-4xl font-bold text-primary">
            {data.studentName}
          </h2>

          <p className="text-lg text-muted-foreground">
            a suivi avec succès la formation
          </p>

          <div className="py-4">
            <Badge className="text-xl px-6 py-2 bg-primary/10 text-primary border-primary/20">
              {data.language}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-8 py-6 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{data.levelAchieved}</p>
              <p className="text-sm text-muted-foreground mt-1">Niveau atteint (CECRL)</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{data.durationHours}h</p>
              <p className="text-sm text-muted-foreground mt-1">Heures de formation</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{data.attendanceRate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Taux d'assiduité</p>
            </div>
          </div>

          <p className="text-muted-foreground">
            Formation réalisée du{" "}
            <span className="font-medium">
              {format(new Date(data.startDate), "d MMMM yyyy", { locale: fr })}
            </span>
            {" "}au{" "}
            <span className="font-medium">
              {format(new Date(data.endDate), "d MMMM yyyy", { locale: fr })}
            </span>
          </p>
        </div>

        <Separator className="my-6" />

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="text-sm text-muted-foreground">
            <p>Référence : {data.inscriptionCode || "N/A"}</p>
            <p>Délivré le {format(new Date(data.issueDate), "d MMMM yyyy", { locale: fr })}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium mb-1">Pour FLI Formation</p>
            <div className="w-32 h-16 border-b border-dashed border-muted-foreground/50"></div>
            <p className="text-xs text-muted-foreground mt-1">Signature</p>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>
            FLI - Foreign Language Immersion • Organisme de formation déclaré sous le n° 84730152573
          </p>
          <p>
            114 rue Jean Jaurès, 73800 Montmélian • contact@fli-formation.fr
          </p>
        </div>
      </div>
    </div>
  );
}
