import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Landmark,
  Loader2,
  Mountain,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { IconChip, StatusPill, SurfaceCard } from "@/components/ui-kit";
import type { RegistrationData } from "@/pages/register/Index";
import {
  createRegistrationCheckout,
  submitRegistration,
  type RegistrationSubmissionResult,
} from "@/services/registrationService";
import { formatPriceEUR, isCustomFormatDuration } from "@/lib/registration-offerings";
import {
  DATES_A_PLANIFIER_LABEL,
  formatDateFr,
  REQUESTED_START_DATE_MESSAGES,
  requestedStartDateProblem,
} from "@/lib/registration-dates";
import {
  CHEQUE_BALANCE_INSTRUCTION,
  CHEQUE_BALANCE_SUMMARY_LABEL,
  FLI_BANK_DETAILS,
  getRegistrationPaymentSummary,
  hasChequeBalance,
  PAYMENT_OPTION_LABELS,
  REGISTRATION_PAYMENT_OPTIONS,
  requiresStripeCheckout,
  type RegistrationPaymentOption,
} from "@/lib/registration-payments";
import {
  studentFacingPisteFromCecrl,
  studentFacingPisteLabel,
} from "@/lib/placement-test-engine";
import {
  isLegalDocumentReadable,
  LEGAL_DOCUMENT_ON_REQUEST_NOTICE,
  legalDocumentTitle,
  REGISTRATION_LEGAL_DOCUMENT_LIST,
  REGISTRATION_LEGAL_DOCUMENTS,
} from "@/lib/registration-legal-documents";
import {
  expectsStationGroupAssignment,
  STATION_GROUP_NOTICE_AFTER_TEST,
  STATION_GROUP_SIGNATURE,
} from "@/lib/registration-group-notice";
import {
  registrationCheckoutFailureNotice,
  registrationFailureNotice,
  REGISTRATION_FAILURE_TITLE,
  type RegistrationFailureNotice,
} from "@/lib/registration-error-message";
import {
  isOpcoFunding,
  REGISTRATION_FUNDING_MAP,
} from "@/lib/registration-utils";
import { OPCO_REGISTER_COPY } from "@/lib/opco-funding";
import { StepActions, StepCard, SummaryPanel, SummaryRow } from "./StepLayout";

interface ConfirmationStepProps {
  data: RegistrationData;
}

const languageLabels: Record<string, string> = {
  english: "Anglais",
  portuguese: "Portugais brésilien",
  russian: "Russe",
  dutch: "Néerlandais",
  german: "Allemand",
  spanish: "Espagnol",
  italian: "Italien",
  chinese: "Chinois",
  french: "Français",
};

const modalityLabels: Record<string, string> = {
  in_person: "Présentiel (collectif)",
  online_individual: "En ligne (individuel)",
  online_group: "En ligne (groupe)",
};

const certificationLabels: Record<string, string> = {
  linguaskill: "Linguaskill",
  bright: "Bright Language",
  none: "Sans certification",
};

export function ConfirmationStep({ data }: ConfirmationStepProps) {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<RegistrationFailureNotice | null>(null);
  const [result, setResult] = useState<{
    inscriptionCode: string;
    accessToken?: string | null;
    needsAdminCall: boolean;
    emailSent: boolean;
    documentsSent?: boolean;
    paymentFlow: "stripe" | "virement" | "none";
    paymentOption?: string;
    coursePrice?: number;
    checkoutFailure?: RegistrationFailureNotice;
  } | null>(null);

  const testCompleted = Boolean(data.testAnswers && data.currentLevel);
  const isStationGroup = expectsStationGroupAssignment(data.modality);
  const isCustomFormat = data.isCustomFormat || isCustomFormatDuration(data.duration);
  const isOpco = isOpcoFunding(data.fundingType);
  const coursePrice = data.price ?? 0;
  const hasPaymentStep = !isCustomFormat && coursePrice > 0 && !isOpco;
  // Décision Paula : aucun mode de règlement coché par défaut, donc aucun repli ici.
  const paymentOption = data.paymentOption ?? null;
  const paymentMissing = hasPaymentStep && !paymentOption;
  const paymentSummary =
    hasPaymentStep && paymentOption
      ? getRegistrationPaymentSummary(coursePrice, paymentOption)
      : null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copié dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleSubmit = async () => {
    if (!testCompleted) {
      toast.error("Le test de niveau est obligatoire avant de soumettre l'inscription.");
      return;
    }

    if (hasPaymentStep && !data.paymentOption) {
      toast.error("Veuillez choisir un mode de paiement.");
      return;
    }

    // BL-029 : une offre sans session datée exige une date de début souhaitée.
    // Sans ce contrôle, l'Edge Function refuse après coup avec le même message.
    const offeringIsDated = Boolean(data.startDate && data.endDate);
    if (!offeringIsDated && requestedStartDateProblem(data.requestedStartDate)) {
      toast.error(REQUESTED_START_DATE_MESSAGES.manquante);
      return;
    }

    setIsSubmitting(true);
    setFailure(null);

    let submission: RegistrationSubmissionResult;
    try {
      submission = await submitRegistration(data);
    } catch (error) {
      // Le message brut reste dans la console pour l'équipe ; le stagiaire lit
      // une version française avec la consigne de contact (BL-025).
      console.error("Registration error:", error);
      setFailure(registrationFailureNotice(error));
      toast.error(REGISTRATION_FAILURE_TITLE);
      setIsSubmitting(false);
      return;
    }

    // À partir d'ici l'inscription existe : une nouvelle soumission créerait un
    // doublon. Un échec du paiement en ligne se dit donc sur l'écran de succès.
    if (
      submission.paymentFlow === "stripe" &&
      data.paymentOption &&
      requiresStripeCheckout(data.paymentOption)
    ) {
      try {
        const origin = window.location.origin;
        const checkout = await createRegistrationCheckout({
          inscriptionId: submission.inscriptionId,
          paymentOption: data.paymentOption,
          email: data.email,
          successUrl: `${origin}/register/payment-success?code=${encodeURIComponent(submission.inscriptionCode)}&session_id={CHECKOUT_SESSION_ID}&option=${encodeURIComponent(data.paymentOption)}`,
          cancelUrl: `${origin}/register/payment-cancel?code=${encodeURIComponent(submission.inscriptionCode)}`,
        });
        window.location.href = checkout.checkoutUrl;
        return;
      } catch (error) {
        console.error("Registration checkout error:", error);
        setResult({
          inscriptionCode: submission.inscriptionCode,
          accessToken: submission.accessToken,
          needsAdminCall: submission.needsAdminCall,
          emailSent: submission.emailSent,
          documentsSent: submission.documentsSent,
          paymentFlow: "none",
          paymentOption: data.paymentOption,
          coursePrice,
          checkoutFailure: registrationCheckoutFailureNotice(error),
        });
        setIsSubmitting(false);
        return;
      }
    }

    setResult({
      inscriptionCode: submission.inscriptionCode,
      accessToken: submission.accessToken,
      needsAdminCall: submission.needsAdminCall,
      emailSent: submission.emailSent,
      documentsSent: submission.documentsSent,
      paymentFlow: submission.paymentFlow,
      paymentOption: data.paymentOption,
      coursePrice,
    });
    setIsSubmitting(false);
  };

  if (result) {
    const suiviUrl =
      result.accessToken && typeof window !== "undefined"
        ? `${window.location.origin}/suivi/${result.accessToken}`
        : null;

    return (
      <SurfaceCard accent="primary" bodyClassName="p-4 sm:p-6">
        <div className="space-y-5">
          {/* Confirmation — lisible d'un coup d'œil sur un téléphone */}
          <div className="flex flex-col items-center gap-3 text-center">
            <IconChip icon={CheckCircle} tone="teal" size="lg" />
            <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              Inscription enregistrée
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Merci de vous être inscrit chez France Langues International.
              {result.documentsSent
                ? " Les documents d'inscription (convention, programme et critères FIF-PL) vous seront envoyés par email dans les 30 minutes."
                : result.emailSent
                  ? " Un email de confirmation vous a été envoyé."
                  : " Notre équipe vous contactera prochainement."}
            </p>
            <StatusPill tone="warning" className="px-4 py-1.5 text-base">
              Code : {result.inscriptionCode}
            </StatusPill>
          </div>

          {suiviUrl && (
            <div className="space-y-2 rounded-[var(--radius-card)] bg-[hsl(var(--surface-sunken))] p-4">
              <p className="text-sm font-medium">Votre lien de suivi</p>
              <p className="break-all text-xs text-muted-foreground">{suiviUrl}</p>
              <div className="flex flex-col gap-2 xs:flex-row">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10 w-full xs:w-auto"
                  onClick={() => copyToClipboard(suiviUrl)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-10 w-full xs:w-auto"
                  asChild
                >
                  <a href={suiviUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Ouvrir
                  </a>
                </Button>
              </div>
            </div>
          )}

          {result.checkoutFailure && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-1 text-left">
                <p className="font-medium">{result.checkoutFailure.title}</p>
                {result.checkoutFailure.detail && <p>{result.checkoutFailure.detail}</p>}
                <p>{result.checkoutFailure.instruction}</p>
              </AlertDescription>
            </Alert>
          )}

          {result.paymentFlow === "virement" && result.coursePrice && result.paymentOption && (
            <Alert>
              <Landmark className="h-4 w-4" />
              <AlertDescription className="space-y-3 text-left">
                <p className="font-medium">
                  {result.paymentOption === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL
                    ? "Virement du montant total"
                    : "Virement des frais de dossier"}
                </p>
                <p>
                  Merci d&apos;effectuer un virement de{" "}
                  <strong>
                    {formatPriceEUR(
                      getRegistrationPaymentSummary(
                        result.coursePrice,
                        result.paymentOption as RegistrationPaymentOption
                      ).amountDueNow
                    )}
                  </strong>{" "}
                  en indiquant la référence <strong>{result.inscriptionCode}</strong>.
                </p>
                <div className="space-y-1 text-sm">
                  <p>Bénéficiaire : {FLI_BANK_DETAILS.beneficiary}</p>
                  <p className="flex flex-wrap items-center gap-2 break-all">
                    IBAN : {FLI_BANK_DETAILS.iban}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Copier l'IBAN"
                      onClick={() => copyToClipboard(FLI_BANK_DETAILS.iban.replace(/\s/g, ""))}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </p>
                  <p>BIC : {FLI_BANK_DETAILS.bic}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result.coursePrice &&
            result.paymentOption &&
            hasChequeBalance(result.paymentOption as RegistrationPaymentOption) &&
            getRegistrationPaymentSummary(
              result.coursePrice,
              result.paymentOption as RegistrationPaymentOption
            ).balanceAfterDossier > 0 && (
              <Alert>
                <AlertDescription className="space-y-2 text-left">
                  <p className="font-medium">
                    Chèque de{" "}
                    {formatPriceEUR(
                      getRegistrationPaymentSummary(
                        result.coursePrice,
                        result.paymentOption as RegistrationPaymentOption
                      ).balanceAfterDossier
                    )}{" "}
                    à envoyer avec votre inscription
                  </p>
                  <p className="text-sm text-muted-foreground">{CHEQUE_BALANCE_INSTRUCTION}</p>
                </AlertDescription>
              </Alert>
            )}

          {isOpco && (
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>{OPCO_REGISTER_COPY.confirmationAlert}</AlertDescription>
            </Alert>
          )}

          {isStationGroup && (
            <Alert>
              <Mountain className="h-4 w-4" />
              <AlertDescription>
                {STATION_GROUP_NOTICE_AFTER_TEST} — {STATION_GROUP_SIGNATURE}
              </AlertDescription>
            </Alert>
          )}
          {result.needsAdminCall && (
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>
                Notre équipe vous contactera par téléphone suite à votre résultat au test.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      <StepCard
        title="Confirmez votre inscription"
        description="Veuillez vérifier vos informations avant de soumettre"
        icon={ClipboardCheck}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">Informations personnelles</p>
            <SummaryPanel>
              <SummaryRow
                label="Nom"
                value={`${data.civility === "madame" ? "Mme" : "M."} ${data.firstName} ${data.lastName}`}
              />
              <SummaryRow label="Email" value={<span className="break-all">{data.email}</span>} />
              <SummaryRow label="Téléphone" value={data.phone} />
            </SummaryPanel>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Formation sélectionnée</p>
            <SummaryPanel>
              <SummaryRow label="Lieu" value={data.locationLabel || data.location} />
              <SummaryRow label="Langue" value={languageLabels[data.language] || data.language} />
              <SummaryRow
                label="Durée"
                value={
                  isCustomFormat ? "Autres formats — devis sur demande" : `${data.duration} heures`
                }
              />
              <SummaryRow label="Modalité" value={modalityLabels[data.modality] || data.modality} />
              {(data.dateLabel || data.dates) && (
                <SummaryRow label="Dates" value={data.dateLabel || data.dates} />
              )}
              {/* BL-029 : la date souhaitée doit apparaître dans le récapitulatif,
                  c'est elle qui sera écrite sur l'inscription. */}
              {data.requestedStartDate && !data.endDate && (
                <SummaryRow
                  label="Début souhaité"
                  value={
                    <>
                      {formatDateFr(data.requestedStartDate)} —{" "}
                      {DATES_A_PLANIFIER_LABEL.toLowerCase()} avec l&apos;équipe FLI
                    </>
                  }
                />
              )}
              {coursePrice > 0 && (
                <SummaryRow label="Tarif" value={formatPriceEUR(coursePrice)} />
              )}
              {isCustomFormat && data.customFormatDetails && (
                <div className="space-y-1 border-t border-border pt-2">
                  <span className="block text-sm text-muted-foreground">Projet décrit</span>
                  <p className="whitespace-pre-wrap text-sm font-medium">
                    {data.customFormatDetails}
                  </p>
                </div>
              )}
              <SummaryRow
                label="Financement"
                value={REGISTRATION_FUNDING_MAP[data.fundingType] || data.fundingType}
              />
              <SummaryRow
                label="Votre piste"
                value={
                  <StatusPill tone="info">
                    {data.testSummary
                      ? studentFacingPisteLabel({
                          passedSlopes: data.testSummary.passedSlopes,
                          highestSlopeReached: data.testSummary.highestSlopeReached,
                          endedAtVocab: data.testSummary.endedAtVocab,
                        })
                      : studentFacingPisteFromCecrl(data.currentLevel)}
                  </StatusPill>
                }
              />
              {data.correctAnswers !== undefined && (
                <SummaryRow
                  label="Score test"
                  value={
                    <>
                      {data.correctAnswers}/
                      {data.totalAnswered ??
                        data.testSummary?.slopeResults.reduce((sum, sr) => sum + sr.total, 0) ??
                        "—"}{" "}
                      bonnes réponses
                    </>
                  }
                />
              )}
              <SummaryRow
                label="Certification"
                value={certificationLabels[data.certification] || data.certification}
              />
            </SummaryPanel>
          </div>

          {isOpco && (
            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>{OPCO_REGISTER_COPY.confirmationAlert}</AlertDescription>
            </Alert>
          )}

          {paymentSummary && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Paiement</p>
                <SummaryPanel>
                  <SummaryRow label="Mode choisi" value={PAYMENT_OPTION_LABELS[paymentOption]} />
                  <SummaryRow
                    label="Frais de dossier"
                    value={formatPriceEUR(paymentSummary.dossierFee)}
                  />
                  {paymentSummary.balanceAfterDossier > 0 && hasChequeBalance(paymentOption) && (
                    <SummaryRow
                      label={CHEQUE_BALANCE_SUMMARY_LABEL}
                      value={formatPriceEUR(paymentSummary.balanceAfterDossier)}
                    />
                  )}
                  <SummaryRow
                    label="À régler maintenant"
                    value={formatPriceEUR(paymentSummary.amountDueNow)}
                    emphasis
                  />
                </SummaryPanel>
              </div>
            </>
          )}

          <Separator />

          {/* BL-023 : le texte à accepter se lit avant la case, dans un nouvel onglet. */}
          <div className="space-y-3 rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-sunken))] p-4">
            <p className="text-sm font-medium">À lire avant d&apos;accepter</p>
            <ul className="space-y-2 text-sm">
              {REGISTRATION_LEGAL_DOCUMENT_LIST.map((document) => (
                <li key={document.key}>
                  {isLegalDocumentReadable(document) ? (
                    <a
                      href={document.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-8 items-center gap-1 font-medium text-foreground underline"
                    >
                      {legalDocumentTitle(document)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      {legalDocumentTitle(document)} — {LEGAL_DOCUMENT_ON_REQUEST_NOTICE}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border p-4">
            <Checkbox
              id="terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-0.5 h-5 w-5"
            />
            <div className="min-w-0 space-y-1">
              <Label htmlFor="terms" className="cursor-pointer">
                J&apos;accepte les conditions générales de formation
              </Label>
              <p className="text-sm text-muted-foreground">
                En soumettant cette inscription, je confirme que les informations fournies sont
                exactes et j&apos;accepte les{" "}
                <a
                  href={REGISTRATION_LEGAL_DOCUMENTS.conditionsGenerales.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline"
                >
                  {REGISTRATION_LEGAL_DOCUMENTS.conditionsGenerales.label}
                </a>{" "}
                de France Langues International.
              </p>
            </div>
          </div>

          {!testCompleted && (
            <Alert variant="destructive">
              <AlertDescription>
                Le test de niveau adaptatif est obligatoire. Revenez à l'étape « Test de niveau » pour
                le compléter avant de soumettre.
              </AlertDescription>
            </Alert>
          )}

          {paymentMissing && (
            <Alert variant="destructive">
              <AlertDescription>
                Aucun mode de règlement n'est choisi. Revenez à l'étape « Paiement » pour en
                sélectionner un avant de soumettre.
              </AlertDescription>
            </Alert>
          )}

          {failure && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-1">
                <p className="font-medium">{failure.title}</p>
                {failure.detail && <p>{failure.detail}</p>}
                <p>{failure.instruction}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </StepCard>

      <StepActions>
        <Button
          onClick={handleSubmit}
          className="h-12 w-full text-base sm:w-auto"
          disabled={!accepted || isSubmitting || !testCompleted || paymentMissing}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {hasPaymentStep && requiresStripeCheckout(paymentOption)
                ? "Redirection vers le paiement..."
                : "Envoi en cours..."}
            </>
          ) : hasPaymentStep && requiresStripeCheckout(paymentOption) ? (
            "Valider et payer en ligne"
          ) : (
            "Soumettre l'inscription"
          )}
        </Button>
      </StepActions>
    </div>
  );
}
