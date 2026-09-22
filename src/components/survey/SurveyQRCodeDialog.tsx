import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateSurveyForInscription } from "@/hooks/useSatisfactionSurvey";
import { Loader2, QrCode, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import fliLogo from "@/assets/fli-logo.png";

interface SurveyQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SurveyQRCodeDialog({ open, onOpenChange }: SurveyQRCodeDialogProps) {
  const [selectedInscription, setSelectedInscription] = useState<string>("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createSurvey = useCreateSurveyForInscription();

  // Fetch active inscriptions (in progress or recently ended)
  const { data: inscriptions, isLoading: loadingInscriptions } = useQuery({
    queryKey: ["active-inscriptions-for-survey"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabase
        .from("inscriptions_complete")
        .select("id, code, student_name, student_id, language, start_date, end_date, course_location")
        .gte("end_date", thirtyDaysAgo)
        .order("end_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleGenerateQR = async () => {
    if (!selectedInscription) {
      toast.error("Veuillez sélectionner une inscription");
      return;
    }

    const inscription = inscriptions?.find((i) => i.id === selectedInscription);
    if (!inscription?.student_id) {
      toast.error("Inscription invalide");
      return;
    }

    try {
      const token = await createSurvey.mutateAsync({
        inscriptionId: selectedInscription,
        studentId: inscription.student_id,
      });

      const baseUrl = window.location.origin;
      setGeneratedUrl(`${baseUrl}/survey/${token}`);
      toast.success("QR Code généré !");
    } catch (err) {
      toast.error("Erreur lors de la génération");
    }
  };

  const handleCopyUrl = async () => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedInscriptionData = inscriptions?.find(
    (i) => i.id === selectedInscription
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Questionnaire
          </DialogTitle>
          <DialogDescription>
            Générez un QR code pour le questionnaire de satisfaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedUrl ? (
            <>
              <div className="space-y-2">
                <Label>Sélectionner une formation</Label>
                {loadingInscriptions ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                ) : (
                  <Select
                    value={selectedInscription}
                    onValueChange={setSelectedInscription}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une inscription..." />
                    </SelectTrigger>
                    <SelectContent>
                      {inscriptions?.map((inscription) => (
                        <SelectItem key={inscription.id} value={inscription.id!}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {inscription.code} - {inscription.student_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {inscription.language} • {inscription.course_location}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                onClick={handleGenerateQR}
                disabled={!selectedInscription || createSurvey.isPending}
                className="w-full"
              >
                {createSurvey.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Générer le QR Code
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {/* QR Code Display - Printable */}
              <div
                className="rounded-[var(--radius-card)] border border-border bg-card p-6 text-center print:border-none"
                id="qr-code-print"
              >
                <img
                  src={fliLogo}
                  alt="FLI"
                  className="mx-auto mb-4 h-10 print:h-12"
                />
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  Questionnaire de satisfaction
                </h3>
                {selectedInscriptionData && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedInscriptionData.student_name} •{" "}
                    {selectedInscriptionData.language}
                  </p>
                )}
                {/* Fond blanc conservé autour des modules : un QR doit rester
                    lisible par un scanner, y compris en thème sombre. */}
                <div className="mb-4 flex justify-center">
                  <QRCodeSVG
                    value={generatedUrl}
                    size={200}
                    level="M"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scannez ce QR code pour donner votre avis
                </p>
              </div>

              {/* URL and Actions */}
              <div className="space-y-2 print:hidden">
                <Label>Lien direct</Label>
                <div className="flex gap-2">
                  <Input value={generatedUrl} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    aria-label="Copier le lien"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-good))]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(generatedUrl, "_blank")}
                    aria-label="Ouvrir le questionnaire dans un nouvel onglet"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint} className="flex-1">
                  Imprimer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedUrl(null);
                    setSelectedInscription("");
                  }}
                  className="flex-1"
                >
                  Nouveau QR Code
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
