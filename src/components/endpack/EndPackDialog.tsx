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
import { StatusPill, toneForStatus } from "@/components/ui-kit";
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
  Send,
  RefreshCw,
} from "lucide-react";
import { useGenerateEndPack } from "@/hooks/useEndPack";
import { useSendTrainingCompletionPack } from "@/hooks/useSendTrainingCompletionPack";
import { useInscriptionProgression } from "@/hooks/useInscriptionProgression";
import { useAttendanceRate } from "@/hooks/useAttendance";
import {
  canIssueCertificate,
  OBJECTIF_ATTEINT_LABELS,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";
import {
  canGenerateEndPackDocuments,
  endPackBlockedReason,
  getStatusLabel,
} from "@/lib/inscription-status";
import { resolveEndPackDeposit } from "@/lib/end-pack";
import { supabase } from "@/integrations/supabase/client";
import { paymentMethodLabel } from "@/lib/payment-methods";

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
    deposit_amount?: number | null;
    balance_after_deposit?: number | null;
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
    status?: string | null;
    end_pack_sent_at?: string | null;
    funding_organization?: string | null;
    course_type?: string | null;
    student_email?: string | null;
    student_city?: string | null;
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
  const [attendanceOverride, setAttendanceOverride] = useState(false);
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [generateCertificate, setGenerateCertificate] = useState(true);
  const [generateAttestation, setGenerateAttestation] = useState(true);
  const [sendSurvey, setSendSurvey] = useState(true);
  const [result, setResult] = useState<{
    invoiceId?: string;
    invoiceNumber?: string | null;
    invoicePath?: string;
    certificateId?: string;
    certificatePath?: string;
    attestationPath?: string;
    surveyToken?: string;
  } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const generateEndPack = useGenerateEndPack();
  const sendPack = useSendTrainingCompletionPack();
  const { data: progression, isLoading: progressionLoading } =
    useInscriptionProgression(open ? inscription.id : undefined);
  const { data: computedAttendance } = useAttendanceRate(
    open ? inscription.id : undefined
  );

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
    if (!open) {
      setResult(null);
      setAttendanceOverride(false);
      setEmailSent(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && computedAttendance != null && !attendanceOverride) {
      setAttendanceRate(Number(computedAttendance));
    }
  }, [open, computedAttendance, attendanceOverride]);

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

  const statut = inscription.status ?? null;
  const alreadyGenerated = Boolean(inscription.end_pack_sent_at);
  const clotureBloquee = statut
    ? endPackBlockedReason(statut, inscription.end_pack_sent_at ?? null)
    : null;
  const canGenerate = canGenerateEndPackDocuments(statut);

  const price = Number(inscription.price) || 0;
  const deposit = resolveEndPackDeposit({
    price,
    deposit_amount: inscription.deposit_amount ?? null,
    balance_after_deposit: inscription.balance_after_deposit ?? null,
  });
  const invoiceRemaining = Math.max(price - deposit, 0);

  const generateAll = async () => {
    const { data: student } = await supabase
      .from("students")
      .select("street_address, postal_code, city, company, email")
      .eq("id", merged.student_id)
      .maybeSingle();

    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_method, payment_date, status")
      .eq("inscription_id", merged.id)
      .order("payment_date", { ascending: true });

    const paidMethods = (payments || [])
      .filter((p) => p.status === "recu" || p.status === "encaisse" || !p.status)
      .map((p) => paymentMethodLabel(p.payment_method || ""))
      .filter(Boolean);
    const uniqueMethods = [...new Set(paidMethods)];

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
      generateAttestation,
      sendSurvey,
      forceRegenerate: true,
      fundingOrganization: inscription.funding_organization ?? "FIFPL",
      pedagogicalAmount: merged.price ?? inscription.price ?? null,
      courseType: merged.course_type ?? inscription.course_type ?? null,
      invoicePdfContext: {
        clientName: merged.student_name,
        clientAddress: student?.street_address ?? null,
        clientPostalCode: student?.postal_code ?? null,
        clientCity: student?.city ?? inscription.student_city ?? null,
        clientCompany: student?.company ?? null,
        courseDescription: `Formation ${merged.language}`,
        courseLocation:
          merged.modality === "en_ligne" || merged.modality === "En ligne"
            ? "En ligne"
            : merged.course_location || merged.modality || null,
        amountHt: price || null,
        amountTtc: price || null,
        acompteAmount: deposit || null,
        status: "paid",
        paymentMethodLabel:
          uniqueMethods.length > 0 ? uniqueMethods.join(" + ") : null,
      },
    });
    setResult(res);
    setEmailSent(false);
    onSuccess?.();
  };

  const handleGenerate = async () => {
    if (generateCertificate && !exitReady) return;
    try {
      await generateAll();
    } catch {
      // toast via hook
    }
  };

  const handleSend = async () => {
    try {
      await sendPack.mutateAsync({ inscriptionId: merged.id });
      setEmailSent(true);
      onSuccess?.();
    } catch {
      // toast via hook
    }
  };

  const handleClose = () => {
    setResult(null);
    setEmailSent(false);
    onOpenChange(false);
  };

  const showGenerateForm = !result;

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

        {showGenerateForm ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusPill tone="neutral">{inscription.code}</StatusPill>
              <StatusPill tone="info">{inscription.language}</StatusPill>
              {inscription.duration_hours && (
                <StatusPill tone="neutral">{inscription.duration_hours}h</StatusPill>
              )}
              {statut && (
                <StatusPill tone={toneForStatus(statut)}>
                  {getStatusLabel(statut, "fr")}
                </StatusPill>
              )}
            </div>

            {clotureBloquee ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{clotureBloquee}</AlertDescription>
              </Alert>
            ) : alreadyGenerated ? (
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  Pack déjà généré. Vous pouvez régénérer les PDF (tampon,
                  signature, facture officielle) puis les envoyer manuellement —
                  les crons sont fermés.
                </AlertDescription>
              </Alert>
            ) : (
              statut && (
                <p className="text-xs text-muted-foreground">
                  La génération clôture l&apos;inscription :{" "}
                  {getStatusLabel(statut, "fr")} → Terminée. L&apos;envoi
                  e-mail se fait ensuite avec le bouton Envoyer.
                </p>
              )
            )}

            <Separator />

            <div className="space-y-3 py-4">
              <Label className="text-base font-medium">Bilan de progression</Label>
              {progressionLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : exitReady ? (
                <div className="rounded-[var(--radius)] border border-border p-3 text-sm space-y-1 bg-[hsl(var(--surface-sunken))]">
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
                  readOnly={computedAttendance != null && !attendanceOverride}
                  onChange={(e) => {
                    setAttendanceOverride(true);
                    setAttendanceRate(Number(e.target.value));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {computedAttendance != null
                    ? attendanceOverride
                      ? "Valeur modifiée manuellement (créneaux contre-signés = source de vérité)."
                      : `Calculé depuis l'émargement contre-signé (${computedAttendance} %).`
                    : "Aucun créneau contre-signé : saisie manuelle."}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4 py-4">
              <Label className="text-base font-medium">Documents à générer</Label>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))]">
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
                      <FileText className="h-4 w-4 text-[hsl(var(--tint-blue-fg))]" />
                      Facture (format officiel)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {deposit > 0
                        ? `${price} € TTC avec acompte ${deposit} € — PDF officiel acquitté`
                        : `Montant (${invoiceRemaining} € HT) — PDF officiel`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))]">
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
                      <Award className="h-4 w-4 text-[hsl(var(--tint-gold-fg))]" />
                      Certificat de fin de formation
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))]">
                  <Checkbox
                    id="attestation"
                    checked={generateAttestation}
                    onCheckedChange={(checked) =>
                      setGenerateAttestation(!!checked)
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="attestation"
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <ClipboardCheck className="h-4 w-4 text-[hsl(var(--tint-blue-fg))]" />
                      Attestation de présence (FIF-PL)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Cachet institutionnel + signature Paula
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))]">
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
                      <ClipboardCheck className="h-4 w-4 text-[hsl(var(--tint-teal-fg))]" />
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
                  !canGenerate ||
                  (!generateInvoice &&
                    !(generateCertificate && exitReady) &&
                    !generateAttestation &&
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
                    {alreadyGenerated
                      ? "Régénérer les documents"
                      : "Générer les documents"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-pill bg-[hsl(var(--tint-teal-bg))] flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-[hsl(var(--tint-teal-fg))]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {emailSent ? "Pack envoyé" : "Documents prêts — à valider"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {emailSent
                  ? "L'e-mail a été envoyé au stagiaire (copie info@fli.fr)."
                  : "Vérifiez les pièces dans Documents de l'inscription, puis envoyez."}
              </p>
              <div className="space-y-3 text-left max-w-sm mx-auto">
                {result.invoiceId && (
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[hsl(var(--tint-blue-bg))] border border-[hsl(var(--tint-blue-ring))]">
                    <FileText className="h-5 w-5 text-[hsl(var(--tint-blue-fg))]" />
                    <p className="font-medium text-sm">
                      Facture{result.invoiceNumber ? ` ${result.invoiceNumber}` : ""}
                      {result.invoicePath ? " (PDF officiel)" : ""}
                    </p>
                  </div>
                )}
                {result.certificateId && (
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[hsl(var(--tint-gold-bg))] border border-[hsl(var(--tint-gold-ring))]">
                    <Award className="h-5 w-5 text-[hsl(var(--tint-gold-fg))]" />
                    <p className="font-medium text-sm">Certificat</p>
                  </div>
                )}
                {result.attestationPath && (
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[hsl(var(--tint-blue-bg))] border border-[hsl(var(--tint-blue-ring))]">
                    <ClipboardCheck className="h-5 w-5 text-[hsl(var(--tint-blue-fg))]" />
                    <p className="font-medium text-sm">
                      Attestation FIF-PL (cachet + signature)
                    </p>
                  </div>
                )}
                {result.surveyToken && (
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[hsl(var(--tint-teal-bg))] border border-[hsl(var(--tint-teal-ring))]">
                    <ClipboardCheck className="h-5 w-5 text-[hsl(var(--tint-teal-fg))]" />
                    <p className="font-medium text-sm">
                      Questionnaire /survey/{result.surveyToken}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Régénérer
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              <Button
                onClick={handleSend}
                disabled={sendPack.isPending || emailSent}
              >
                {sendPack.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {emailSent ? "Envoyé" : "Envoyer"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
