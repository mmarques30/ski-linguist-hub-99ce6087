import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Landmark, Receipt, Wallet, FileText } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import {
  CHEQUE_BALANCE_INSTRUCTION,
  CHEQUE_BALANCE_SUMMARY_LABEL,
  FRAIS_DOSSIER_EUR,
  FLI_BANK_DETAILS,
  getAvailablePaymentOptions,
  getRegistrationPaymentSummary,
  hasChequeBalance,
  isSchoolFifplCheque,
  PAYMENT_OPTION_DESCRIPTIONS,
  PAYMENT_OPTION_LABELS,
  REGISTRATION_PAYMENT_OPTIONS,
  requiresVirementInstructions,
  type RegistrationPaymentOption,
} from "@/lib/registration-payments";
import {
  CHATEL_PENDING_PRICE_MESSAGE,
  formatPriceEUR,
  hidesDepositPaymentOptions,
  isCustomFormatDuration,
  requiresMandatoryFifplEstimate,
  type SessionFundingMode,
} from "@/lib/registration-offerings";
import { isAgeficeFundingType, isFifplFunding, isOpcoFunding } from "@/lib/registration-utils";
import {
  OPCO_REGISTER_COPY,
  validateOpcoQuestionnaire,
  type OpcoQuestionnaire,
} from "@/lib/opco-funding";
import {
  estimateFifplRights,
  FIFPL_REGISTER_COPY,
  validateFifplQuestionnaire,
  type FifplQuestionnaire,
} from "@/lib/fifpl-funding";
import {
  AGEFICE_CEILINGS_URL,
  AGEFICE_REGISTER_COPY,
} from "@/lib/agefice-funding";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { OptionCard, StepActions, StepCard, SummaryPanel, SummaryRow } from "./StepLayout";
import { FifplCfpSection } from "./FifplCfpSection";

interface PaymentStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const PAYMENT_OPTION_ICONS: Record<
  RegistrationPaymentOption,
  typeof CreditCard
> = {
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]: CreditCard,
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT]: Landmark,
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]: Receipt,
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL]: Landmark,
  [REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE]: FileText,
};

export function PaymentStep({ data, onUpdate, onNext }: PaymentStepProps) {
  const isCustomFormat = data.isCustomFormat || isCustomFormatDuration(data.duration);
  const isOpco = isOpcoFunding(data.fundingType ?? "");
  const isFifpl = isFifplFunding(data.fundingType ?? "");
  const isAgefice = isAgeficeFundingType(data.fundingType ?? "");
  const fundingMode: SessionFundingMode = data.sessionFundingMode ?? "individuel";
  const noDepositSession = hidesDepositPaymentOptions(fundingMode);
  const mandatoryFifplEstimate = requiresMandatoryFifplEstimate(fundingMode);
  const pricePending = Boolean(data.pricePending);
  const coursePrice = data.price ?? 0;
  const hasPrice = coursePrice > 0;

  // Décision Paula : aucun mode de règlement coché par défaut.
  const selectedOption: RegistrationPaymentOption | null = data.paymentOption ?? null;

  const availableOptions = useMemo(
    () => getAvailablePaymentOptions(fundingMode),
    [fundingMode]
  );

  const fifplQuestionnaire: FifplQuestionnaire = {
    status: data.fifplStatus ?? null,
    cfpAttestationYear: data.fifplCfpAttestationYear ?? null,
    cfpContributionEur: data.fifplCfpContributionEur ?? null,
    cfpAttestationPath: data.fifplCfpAttestationPath ?? null,
    cfpAttestationFileName: data.fifplCfpAttestationFileName ?? null,
    hadOtherFifplTrainingThisYear: data.fifplHadOtherTrainingThisYear ?? null,
    otherFifplAmountAlreadyCoveredEur: data.fifplOtherAmountAlreadyCoveredEur ?? null,
    parseWarnings: data.fifplParseWarnings ?? [],
  };

  const showFifplEstimate =
    isFifpl &&
    (mandatoryFifplEstimate || data.fifplEstimateWanted === true);

  const payableAmount = useMemo(() => {
    if (!isFifpl || !noDepositSession || !showFifplEstimate) return coursePrice;
    const rights = estimateFifplRights({
      status: fifplQuestionnaire.status,
      cfpContributionEur: fifplQuestionnaire.cfpContributionEur,
      modality: data.modality,
      alreadyCoveredEur:
        fifplQuestionnaire.hadOtherFifplTrainingThisYear === true
          ? fifplQuestionnaire.otherFifplAmountAlreadyCoveredEur
          : 0,
      coursePriceEur: coursePrice,
    });
    // Part moniteur = montant accord FIF-PL estimé (SESSIONS §3.3 / §3.4).
    return rights?.coveredOnCourseEur ?? coursePrice;
  }, [
    isFifpl,
    noDepositSession,
    showFifplEstimate,
    coursePrice,
    fifplQuestionnaire.status,
    fifplQuestionnaire.cfpContributionEur,
    fifplQuestionnaire.hadOtherFifplTrainingThisYear,
    fifplQuestionnaire.otherFifplAmountAlreadyCoveredEur,
    data.modality,
  ]);

  const patchFifpl = (patch: Partial<FifplQuestionnaire>) => {
    const next = { ...fifplQuestionnaire, ...patch };
    onUpdate({
      fifplStatus: next.status,
      fifplCfpAttestationYear: next.cfpAttestationYear,
      fifplCfpContributionEur: next.cfpContributionEur,
      fifplCfpAttestationPath: next.cfpAttestationPath,
      fifplCfpAttestationFileName: next.cfpAttestationFileName,
      fifplHadOtherTrainingThisYear: next.hadOtherFifplTrainingThisYear,
      fifplOtherAmountAlreadyCoveredEur: next.otherFifplAmountAlreadyCoveredEur,
      fifplParseWarnings: next.parseWarnings,
    });
  };

  useEffect(() => {
    if ((isOpco || pricePending) && data.paymentOption) {
      onUpdate({ paymentOption: undefined });
    }
  }, [isOpco, pricePending, data.paymentOption, onUpdate]);

  // Si le mode de session change, retire une option devenue invalide (ex. acompte sur Méribel).
  useEffect(() => {
    if (
      selectedOption &&
      !availableOptions.includes(selectedOption)
    ) {
      onUpdate({ paymentOption: undefined });
    }
  }, [availableOptions, selectedOption, onUpdate]);

  const summary = useMemo(
    () =>
      hasPrice && selectedOption
        ? getRegistrationPaymentSummary(payableAmount, selectedOption)
        : null,
    [payableAmount, hasPrice, selectedOption]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFifpl) {
      const error = validateFifplQuestionnaire(fifplQuestionnaire);
      if (error) {
        toast.error(error);
        return;
      }
      if (
        !mandatoryFifplEstimate &&
        data.fifplEstimateWanted == null
      ) {
        toast.error("Indiquez si vous souhaitez estimer vos droits FIF-PL.");
        return;
      }
    }
    if (!isCustomFormat && hasPrice && !selectedOption && !pricePending) {
      toast.error("Veuillez choisir un mode de règlement pour continuer.");
      return;
    }
    onNext();
  };

  if (isOpco) {
    const questionnaire: OpcoQuestionnaire = {
      knowsOpco: data.opcoKnowsOpco ?? null,
      opcoName: data.opcoName ?? "",
      nafCode: data.opcoNafCode ?? "",
      caseNotes: data.opcoCaseNotes ?? "",
    };

    const handleOpcoContinue = () => {
      const error = validateOpcoQuestionnaire(questionnaire);
      if (error) {
        toast.error(error);
        return;
      }
      onNext();
    };

    return (
      <div className="space-y-4">
        <StepCard
          title={OPCO_REGISTER_COPY.paymentTitle}
          description={OPCO_REGISTER_COPY.paymentDescription}
          icon={Landmark}
        >
          <div className="space-y-6">
            <Alert>
              <AlertDescription>{OPCO_REGISTER_COPY.paymentAlert}</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label>Connaissez-vous l&apos;OPCO qui vous prendra en charge ? *</Label>
              <RadioGroup
                value={
                  questionnaire.knowsOpco === true
                    ? "yes"
                    : questionnaire.knowsOpco === false
                      ? "no"
                      : ""
                }
                onValueChange={(value) =>
                  onUpdate({
                    opcoKnowsOpco: value === "yes",
                    ...(value === "yes" ? { opcoNafCode: "" } : { opcoName: "" }),
                  })
                }
                className="grid gap-2 xs:grid-cols-2"
              >
                <OptionCard selected={questionnaire.knowsOpco === true}>
                  <Label
                    htmlFor="opco-known-yes"
                    className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                  >
                    <RadioGroupItem value="yes" id="opco-known-yes" />
                    Oui
                  </Label>
                </OptionCard>
                <OptionCard selected={questionnaire.knowsOpco === false}>
                  <Label
                    htmlFor="opco-known-no"
                    className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                  >
                    <RadioGroupItem value="no" id="opco-known-no" />
                    Non
                  </Label>
                </OptionCard>
              </RadioGroup>
            </div>

            {questionnaire.knowsOpco === true && (
              <div className="space-y-2">
                <Label htmlFor="opco-name">Quel OPCO ? *</Label>
                <Input
                  id="opco-name"
                  value={questionnaire.opcoName}
                  onChange={(e) => onUpdate({ opcoName: e.target.value })}
                  placeholder="Ex. AKTO, Uniformation, AFDAS…"
                  className="h-11"
                />
              </div>
            )}

            {questionnaire.knowsOpco === false && (
              <div className="space-y-2">
                <Label htmlFor="opco-naf">Code NAF de votre activité *</Label>
                <Input
                  id="opco-naf"
                  value={questionnaire.nafCode}
                  onChange={(e) => onUpdate({ opcoNafCode: e.target.value })}
                  placeholder="Ex. 8551Z"
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="opco-notes">Précisez votre situation (facultatif)</Label>
              <Textarea
                id="opco-notes"
                value={questionnaire.caseNotes}
                onChange={(e) => onUpdate({ opcoCaseNotes: e.target.value })}
                placeholder="Expliquez votre cas : entreprise, demande en cours, questions…"
                rows={4}
              />
            </div>
          </div>
        </StepCard>

        <StepActions>
          <Button
            type="button"
            onClick={handleOpcoContinue}
            className="h-12 w-full text-base sm:w-auto"
          >
            Continuer
          </Button>
        </StepActions>
      </div>
    );
  }

  if (isCustomFormat || !hasPrice || pricePending) {
    const handleContinueWithoutPrice = () => {
      if (isFifpl) {
        const error = validateFifplQuestionnaire(fifplQuestionnaire);
        if (error) {
          toast.error(error);
          return;
        }
        if (!mandatoryFifplEstimate && data.fifplEstimateWanted == null && !pricePending) {
          toast.error("Indiquez si vous souhaitez estimer vos droits FIF-PL.");
          return;
        }
      }
      onNext();
    };

    return (
      <div className="space-y-4">
        {isFifpl && (
          <StepCard
            title={FIFPL_REGISTER_COPY.sectionTitle}
            description={FIFPL_REGISTER_COPY.sectionDescription}
            icon={FileText}
          >
            {!mandatoryFifplEstimate && (
              <div className="mb-4 space-y-3">
                <Label>Souhaitez-vous estimer vos droits FIF-PL ?</Label>
                <RadioGroup
                  value={
                    data.fifplEstimateWanted === true
                      ? "yes"
                      : data.fifplEstimateWanted === false
                        ? "no"
                        : ""
                  }
                  onValueChange={(value) =>
                    onUpdate({ fifplEstimateWanted: value === "yes" })
                  }
                  className="grid gap-2 xs:grid-cols-2"
                >
                  <OptionCard selected={data.fifplEstimateWanted === true}>
                    <Label
                      htmlFor="fifpl-est-yes-pending"
                      className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                    >
                      <RadioGroupItem value="yes" id="fifpl-est-yes-pending" />
                      Oui
                    </Label>
                  </OptionCard>
                  <OptionCard selected={data.fifplEstimateWanted === false}>
                    <Label
                      htmlFor="fifpl-est-no-pending"
                      className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                    >
                      <RadioGroupItem value="no" id="fifpl-est-no-pending" />
                      Non
                    </Label>
                  </OptionCard>
                </RadioGroup>
              </div>
            )}
            <FifplCfpSection
              questionnaire={fifplQuestionnaire}
              modality={data.modality}
              coursePriceEur={hasPrice ? coursePrice : null}
              showEstimate={showFifplEstimate}
              onChange={patchFifpl}
            />
          </StepCard>
        )}

        <StepCard
          title="Paiement"
          description={
            pricePending
              ? "Inscription enregistrée sans paiement — tarif partenaire en attente de décision ESF."
              : "Format sur devis — les modalités de paiement vous seront communiquées avec la proposition commerciale."
          }
          icon={Wallet}
        >
          {pricePending ? (
            <Alert>
              <AlertDescription className="space-y-2 text-sm">
                <p>{CHATEL_PENDING_PRICE_MESSAGE}</p>
                <p className="text-muted-foreground">
                  Statut : en attente tarif. Le lien de paiement et vos documents vous seront
                  envoyés dès que le tarif définitif est fixé.
                </p>
              </AlertDescription>
            </Alert>
          ) : null}
        </StepCard>

        <StepActions>
          <Button
            type="button"
            onClick={handleContinueWithoutPrice}
            className="h-12 w-full text-base sm:w-auto"
          >
            Continuer
          </Button>
        </StepActions>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAgefice && (
        <StepCard
          title={AGEFICE_REGISTER_COPY.paymentTitle}
          description={AGEFICE_REGISTER_COPY.paymentDescription}
          icon={FileText}
        >
          <div className="space-y-3">
            <Alert>
              <AlertDescription>{AGEFICE_REGISTER_COPY.paymentAlert}</AlertDescription>
            </Alert>
            <p className="text-sm">
              <a
                href={AGEFICE_CEILINGS_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {AGEFICE_REGISTER_COPY.ceilingsLinkLabel}
              </a>
            </p>
          </div>
        </StepCard>
      )}

      {isFifpl && (
        <StepCard
          title={FIFPL_REGISTER_COPY.sectionTitle}
          description={FIFPL_REGISTER_COPY.sectionDescription}
          icon={FileText}
        >
          {!mandatoryFifplEstimate && (
            <div className="mb-4 space-y-3">
              <Label>Souhaitez-vous estimer vos droits FIF-PL ?</Label>
              <RadioGroup
                value={
                  data.fifplEstimateWanted === true
                    ? "yes"
                    : data.fifplEstimateWanted === false
                      ? "no"
                      : ""
                }
                onValueChange={(value) =>
                  onUpdate({ fifplEstimateWanted: value === "yes" })
                }
                className="grid gap-2 xs:grid-cols-2"
              >
                <OptionCard selected={data.fifplEstimateWanted === true}>
                  <Label
                    htmlFor="fifpl-est-yes"
                    className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                  >
                    <RadioGroupItem value="yes" id="fifpl-est-yes" />
                    Oui
                  </Label>
                </OptionCard>
                <OptionCard selected={data.fifplEstimateWanted === false}>
                  <Label
                    htmlFor="fifpl-est-no"
                    className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
                  >
                    <RadioGroupItem value="no" id="fifpl-est-no" />
                    Non
                  </Label>
                </OptionCard>
              </RadioGroup>
            </div>
          )}
          {(mandatoryFifplEstimate || data.fifplEstimateWanted != null) && (
            <FifplCfpSection
              questionnaire={fifplQuestionnaire}
              modality={data.modality}
              coursePriceEur={coursePrice}
              showEstimate={showFifplEstimate}
              onChange={patchFifpl}
            />
          )}
        </StepCard>
      )}

      <StepCard
        title={noDepositSession ? "Paiement de votre part" : "Frais de dossier et paiement"}
        description={
          noDepositSession
            ? `Aucun acompte demandé. Réglez votre part (${formatPriceEUR(payableAmount)}) — montant de l'accord préalable FIF-PL — ou remettez le chèque FIF-PL à votre école.`
            : `Les frais de dossier de ${formatPriceEUR(FRAIS_DOSSIER_EUR)} sont déduits du tarif total de la formation (${formatPriceEUR(coursePrice)}).`
        }
        icon={Wallet}
      >
        <div className="space-y-6">
          <SummaryPanel>
            <SummaryRow
              label={noDepositSession ? "Votre part (estimée)" : "Tarif formation"}
              value={formatPriceEUR(payableAmount)}
            />
            {!noDepositSession && (
              <SummaryRow
                label="Frais de dossier (déduits)"
                value={`− ${formatPriceEUR(FRAIS_DOSSIER_EUR)}`}
              />
            )}
            {summary &&
              summary.balanceAfterDossier > 0 &&
              hasChequeBalance(selectedOption) &&
              !isSchoolFifplCheque(selectedOption) && (
                <SummaryRow
                  label={CHEQUE_BALANCE_SUMMARY_LABEL}
                  value={formatPriceEUR(summary.balanceAfterDossier)}
                />
              )}
            {isSchoolFifplCheque(selectedOption) && (
              <SummaryRow
                label="Chèque FIF-PL via l'école"
                value={formatPriceEUR(payableAmount)}
              />
            )}
            <SummaryRow
              label="À régler maintenant"
              value={summary ? formatPriceEUR(summary.amountDueNow) : "selon le mode choisi"}
              emphasis
            />
          </SummaryPanel>

          <div className="space-y-3">
            <Label>Choisissez votre mode de règlement</Label>
            <RadioGroup
              value={selectedOption ?? ""}
              onValueChange={(value) =>
                onUpdate({ paymentOption: value as RegistrationPaymentOption })
              }
              className="space-y-3"
            >
              {availableOptions.map((value) => {
                const Icon = PAYMENT_OPTION_ICONS[value];
                return (
                  <OptionCard key={value} selected={selectedOption === value}>
                    <Label
                      htmlFor={value}
                      className="flex cursor-pointer items-start gap-3 p-4 font-normal"
                    >
                      <RadioGroupItem value={value} id={value} className="mt-1" />
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <Icon
                            className="h-4 w-4 shrink-0 text-[hsl(var(--tint-gold-fg))]"
                            aria-hidden
                          />
                          {PAYMENT_OPTION_LABELS[value]}
                        </span>
                        <span className="block text-sm font-normal text-muted-foreground">
                          {PAYMENT_OPTION_DESCRIPTIONS[value]}
                        </span>
                      </span>
                    </Label>
                  </OptionCard>
                );
              })}
            </RadioGroup>
          </div>

          {summary &&
            summary.balanceAfterDossier > 0 &&
            hasChequeBalance(selectedOption) &&
            !isSchoolFifplCheque(selectedOption) && (
            <Alert>
              <Receipt className="h-4 w-4" />
              <AlertDescription className="space-y-1 text-sm">
                <p className="font-medium">
                  Chèque de {formatPriceEUR(summary.balanceAfterDossier)} à envoyer avant le début de la formation
                </p>
                <p className="text-muted-foreground">{CHEQUE_BALANCE_INSTRUCTION}</p>
              </AlertDescription>
            </Alert>
          )}

          {isSchoolFifplCheque(selectedOption) && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {PAYMENT_OPTION_DESCRIPTIONS[REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE]}
              </AlertDescription>
            </Alert>
          )}

          {requiresVirementInstructions(selectedOption) && (
            <Alert>
              <Landmark className="h-4 w-4" />
              <AlertDescription className="space-y-1 text-sm">
                <p>
                  Après validation de votre inscription, vous recevrez les coordonnées bancaires pour
                  le virement de{" "}
                  <strong>
                    {selectedOption === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL
                      ? formatPriceEUR(coursePrice)
                      : formatPriceEUR(FRAIS_DOSSIER_EUR)}
                  </strong>
                  .
                </p>
                <p className="break-words text-muted-foreground">
                  IBAN : {FLI_BANK_DETAILS.iban} · BIC : {FLI_BANK_DETAILS.bic}
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </StepCard>

      <StepActions>
        <Button type="submit" className="h-12 w-full text-base sm:w-auto" disabled={!selectedOption}>
          Continuer vers la confirmation
        </Button>
      </StepActions>
    </form>
  );
}
