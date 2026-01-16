import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Award, 
  ClipboardCheck, 
  Loader2, 
  CheckCircle2,
  Package
} from "lucide-react";
import { useGenerateEndPack } from "@/hooks/useEndPack";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface EndPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscription: {
    id: string;
    student_id: string;
    student_name: string;
    language: string;
    entry_level?: string | null;
    exit_level?: string | null;
    duration_hours?: number | null;
    price?: number | null;
    code?: string | null;
  };
  onSuccess?: () => void;
}

export function EndPackDialog({
  open,
  onOpenChange,
  inscription,
  onSuccess,
}: EndPackDialogProps) {
  const [exitLevel, setExitLevel] = useState(inscription.exit_level || inscription.entry_level || "B1");
  const [attendanceRate, setAttendanceRate] = useState(100);
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [generateCertificate, setGenerateCertificate] = useState(true);
  const [sendSurvey, setSendSurvey] = useState(true);
  const [result, setResult] = useState<{
    invoiceId?: string;
    certificateId?: string;
    surveyToken?: string;
  } | null>(null);

  const generateEndPack = useGenerateEndPack();

  const handleGenerate = async () => {
    const res = await generateEndPack.mutateAsync({
      inscriptionId: inscription.id,
      studentId: inscription.student_id,
      exitLevel,
      attendanceRate,
      generateInvoice,
      generateCertificate,
      sendSurvey,
    });
    setResult(res);
    onSuccess?.();
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Pack Fin de Formation
          </DialogTitle>
          <DialogDescription>
            Générer automatiquement les documents de fin de formation pour{" "}
            <span className="font-medium">{inscription.student_name}</span>
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            {/* Inscription Info */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{inscription.code}</Badge>
              <Badge variant="secondary">{inscription.language}</Badge>
              {inscription.duration_hours && (
                <Badge variant="secondary">{inscription.duration_hours}h</Badge>
              )}
            </div>

            <Separator />

            {/* Level Selection */}
            <div className="space-y-4 py-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Niveau d'entrée</Label>
                  <Input 
                    value={inscription.entry_level || "Non évalué"} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitLevel">Niveau de sortie</Label>
                  <Select value={exitLevel} onValueChange={setExitLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance">Taux d'assiduité (%)</Label>
                <Input
                  id="attendance"
                  type="number"
                  min={0}
                  max={100}
                  value={attendanceRate}
                  onChange={(e) => setAttendanceRate(Number(e.target.value))}
                />
              </div>
            </div>

            <Separator />

            {/* Documents to Generate */}
            <div className="space-y-4 py-4">
              <Label className="text-base font-medium">Documents à générer</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="invoice"
                    checked={generateInvoice}
                    onCheckedChange={(checked) => setGenerateInvoice(!!checked)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="invoice"
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-blue-600" />
                      Facture de solde
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Facture pour le montant restant ({inscription.price || 0}€ HT)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="certificate"
                    checked={generateCertificate}
                    onCheckedChange={(checked) => setGenerateCertificate(!!checked)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="certificate"
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Award className="h-4 w-4 text-amber-600" />
                      Certificat de formation
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Attestation de réalisation avec niveau atteint
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="survey"
                    checked={sendSurvey}
                    onCheckedChange={(checked) => setSendSurvey(!!checked)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="survey"
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                      Questionnaire de satisfaction
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Envoi automatique du lien vers le questionnaire
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateEndPack.isPending || (!generateInvoice && !generateCertificate && !sendSurvey)}
              >
                {generateEndPack.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Générer le pack
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="py-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pack généré avec succès !</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Les documents suivants ont été créés :
              </p>

              <div className="space-y-3 text-left max-w-sm mx-auto">
                {result.invoiceId && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Facture créée</p>
                      <p className="text-xs text-muted-foreground">
                        Visible dans la section Factures
                      </p>
                    </div>
                  </div>
                )}

                {result.certificateId && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Award className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-sm">Certificat créé</p>
                      <p className="text-xs text-muted-foreground">
                        Niveau {exitLevel} - Assiduité {attendanceRate}%
                      </p>
                    </div>
                  </div>
                )}

                {result.surveyToken && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-sm">Questionnaire prêt</p>
                      <p className="text-xs text-muted-foreground break-all">
                        /survey/{result.surveyToken}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Fermer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
