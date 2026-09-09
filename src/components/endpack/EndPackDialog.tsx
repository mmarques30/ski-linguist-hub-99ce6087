import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Award,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useGenerateEndPack } from "@/hooks/useEndPack";
import { useInscriptionProgression } from "@/hooks/useInscriptionProgression";
import {
  canIssueCertificate,
  OBJECTIF_ATTEINT_LABELS,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";

interface EndPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscription: {
    id: string;
    student_id: string;
    student_name: string;
    language: string;
    start_date?: string | null;
    end_date?: string | null;
    duration_hours?: number | null;
    hours_followed?: number | null;
    price?: number | null;
    code?: string | null;
    course_location?: string | null;
    modality?: string | null;
    formateur?: string | null;
    niveau_general_entree?: string | null;
    niveau_technique_entree?: string | null;
    niveau_general_sortie?: string | null;
    niveau_technique_sortie?: string | null;
    objectif_atteint?: string | null;
    commentaire_sortie?: string | null;
  };
  onSuccess?: () => void;
}

export function EndPackDialog({
  open,
  onOpenChange,
  inscription,
  onSuccess,
}: EndPackDialogProps) {
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
  const { data: progression, isLoading: progressionLoading } =
    useInscriptionProgression(open ? inscription.id : undefined);

  const merged = useMemo(
    () => ({
      ...inscription,
      niveau_general_entree:
        progression?.niveau_general_entree ?? inscription.niveau_general_entree,
      niveau_technique_entree:
        progression?.niveau_technique_entree ?? inscription.niveau_technique_entree,
      niveau_general_sortie:
        progression?.niveau_general_sortie ?? inscription.niveau_general_sortie,
      niveau_technique_sortie:
        progression?.niveau_technique_sortie ?? inscription.niveau_technique_sortie,
      objectif_atteint:
        progression?.objectif_atteint ?? inscription.objectif_atteint,
      commentaire_sortie:
        progression?.commentaire_sortie ?? inscription.commentaire_sortie,
      hours_followed: progression?.hours_followed ?? inscription.hours_followed,
      start_date: inscription.start_date,
      end_date: inscription.end_date ?? progression?.end_date,
    }),
    [inscription, progression]
  );

  useEffect(() => {
    if (!open) setResult(null);
  }, [open]);

  const exitReady = useMemo(
    () =>
      canIssueCertificate({
        niveau_general_sortie: merged.niveau_general_sortie ?? null,
        niveau_technique_sortie: merged.niveau_technique_sortie ?? null,
        objectif_atteint: merged.objectif_atteint ?? null,
        commentaire_sortie: merged.commentaire_sortie ?? null,
      }),
    [merged]
  );

  const handleGenerate = async () => {
    if (generateCertificate && !exitReady) return;
    const res = await generateEndPack.mutateAsync({
      inscriptionId: merged.id,
      studentId: merged.student_id,
      studentName: merged.student_name,
      language: merged.language,
      startDate: merged.start_date || new Date().toISOString().slice(0, 10),
      endDate: merged.end_date || new Date().toISOString().slice(0, 10),
      durationHours: merged.duration_hours ?? null,
      hoursFollowed: merged.hours_followed ?? merged.duration_hours ?? null,
      courseLocation: merged.course_location ?? null,
      modality: merged.modality ?? null,
      formateurName: merged.formateur ?? null,
      code: merged.code ?? null,
      niveauGeneralEntree: merged.niveau_general_entree || "—",
      niveauTechniqueEntree: merged.niveau_technique_entree || "—",
      niveauGeneralSortie: merged.niveau_general_sortie!,
      niveauTechniqueSortie: merged.niveau_technique_sortie!,
      objectifAtteint: merged.objectif_atteint as ObjectifAtteint,
      commentaireSortie: merged.commentaire_sortie!,
      attendanceRate,
      generateInvoice,
      generateCertificate: generateCertificate && exitReady,
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
            Documents de fin de formation pour{" "}
            <span className="font-medium">{inscription.student_name}</span>
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{inscription.code}</Badge>
              <Badge variant="secondary">{inscription.language}</Badge>
              {inscription.duration_hours && (
                <Badge variant="secondary">{inscription.duration_hours}h</Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-3 py-4">
              <Label className="text-base font-medium">Bilan de progression</Label>
              {progressionLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : exitReady ? (
                <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/30">
                  <p>
                    Général : {merged.niveau_general_entree || "—"} →{" "}
                    {merged.niveau_general_sortie}
                  </p>
                  <p>
                    Technique : {merged.niveau_technique_entree || "—"} →{" "}
                    {merged.niveau_technique_sortie}
                  </p>
                  <p>
                    Objectif :{" "}
                    {OBJECTIF_ATTEINT_LABELS[
                      merged.objectif_atteint as ObjectifAtteint
                    ] || merged.objectif_atteint}
                  </p>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Formulaire de sortie formateur incomplet. Pas de certificat
                    sans ce formulaire — complétez-le d&apos;abord (documents
                    manquants).
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="attendance">Taux d&apos;assiduité (%)</Label>
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
                      Montant restant ({inscription.price || 0}€ HT)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="certificate"
                    checked={generateCertificate && exitReady}
                    disabled={!exitReady}
                    onCheckedChange={(checked) =>
                      setGenerateCertificate(!!checked)
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="certificate"
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Award className="h-4 w-4 text-amber-600" />
                      Certificat de fin de formation
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Bilan Entrée / Sortie (jamais SNMSF/DSF ; jamais piste comme
                      niveau final)
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
                disabled={
                  generateEndPack.isPending ||
                  progressionLoading ||
                  (!generateInvoice &&
                    !(generateCertificate && exitReady) &&
                    !sendSurvey)
                }
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
            <div className="py-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pack généré</h3>
              <div className="space-y-3 text-left max-w-sm mx-auto">
                {result.invoiceId && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-sm">Facture créée</p>
                  </div>
                )}
                {result.certificateId && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Award className="h-5 w-5 text-amber-600" />
                    <p className="font-medium text-sm">
                      Certificat créé (bilan de progression)
                    </p>
                  </div>
                )}
                {result.surveyToken && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                    <p className="font-medium text-sm">
                      Questionnaire /survey/{result.surveyToken}
                    </p>
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
