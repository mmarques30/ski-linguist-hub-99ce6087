import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Landmark, Receipt, Wallet } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import {
  CHEQUE_BALANCE_INSTRUCTION,
  CHEQUE_BALANCE_SUMMARY_LABEL,
  FRAIS_DOSSIER_EUR,
  FLI_BANK_DETAILS,
  getRegistrationPaymentSummary,
  hasChequeBalance,
  PAYMENT_OPTION_DESCRIPTIONS,
  PAYMENT_OPTION_LABELS,
  REGISTRATION_PAYMENT_OPTIONS,
  requiresVirementInstructions,
  type RegistrationPaymentOption,
} from "@/lib/registration-payments";
import { formatPriceEUR, isCustomFormatDuration } from "@/lib/registration-offerings";
import { isOpcoFunding } from "@/lib/registration-utils";
import {
  OPCO_REGISTER_COPY,
  validateOpcoQuestionnaire,
  type OpcoQuestionnaire,
} from "@/lib/opco-funding";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { OptionCard, StepActions, StepCard, SummaryPanel, SummaryRow } from "./StepLayout";

interface PaymentStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const paymentOptions: Array<{
  value: RegistrationPaymentOption;
  icon: typeof CreditCard;
}> = [
  { value: REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE, icon: CreditCard },
  { value: REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT, icon: Landmark },
  { value: REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL, icon: Receipt },
  { value: REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL, icon: Landmark },
];

export function PaymentStep({ data, onUpdate, onNext }: PaymentStepProps) {
  const isCustomFormat = data.isCustomFormat || isCustomFormatDuration(data.duration);
  const isOpco = isOpcoFunding(data.fundingType ?? "");
  const coursePrice = data.price ?? 0;
  const hasPrice = coursePrice > 0;

  // Décision Paula : aucun mode de règlement coché par défaut.
  const selectedOption: RegistrationPaymentOption | null = data.paymentOption ?? null;

  useEffect(() => {
    if (isOpco && data.paymentOption) {
      onUpdate({ paymentOption: undefined });
    }
  }, [isOpco, data.paymentOption, onUpdate]);

  const summary = useMemo(
    () =>
      hasPrice && selectedOption
        ? getRegistrationPaymentSummary(coursePrice, selectedOption)
        : null,
    [coursePrice, hasPrice, selectedOption]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomFormat && hasPrice && !selectedOption) {
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

  if (isCustomFormat || !hasPrice) {
    return (
      <div className="space-y-4">
        <StepCard
          title="Paiement"
          description="Format sur devis — les modalités de paiement vous seront communiquées avec la proposition commerciale."
          icon={Wallet}
        >
          <Alert>
            <AlertDescription>
              Pour les formats personnalisés, aucun règlement n&apos;est demandé à cette étape.
              Les frais de dossier ({formatPriceEUR(FRAIS_DOSSIER_EUR)}) seront précisés dans le
              devis.
            </AlertDescription>
          </Alert>
        </StepCard>

        <StepActions>
          <Button type="button" onClick={onNext} className="h-12 w-full text-base sm:w-auto">
            Continuer
          </Button>
        </StepActions>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StepCard
        title="Frais de dossier et paiement"
        description={`Les frais de dossier de ${formatPriceEUR(FRAIS_DOSSIER_EUR)} sont déduits du tarif total de la formation (${formatPriceEUR(coursePrice)}).`}
        icon={Wallet}
      >
        <div className="space-y-6">
          <SummaryPanel>
            <SummaryRow label="Tarif formation" value={formatPriceEUR(coursePrice)} />
            <SummaryRow
              label="Frais de dossier (déduits)"
              value={`− ${formatPriceEUR(FRAIS_DOSSIER_EUR)}`}
            />
            {summary && summary.balanceAfterDossier > 0 && hasChequeBalance(selectedOption) && (
              <SummaryRow
                label={CHEQUE_BALANCE_SUMMARY_LABEL}
                value={formatPriceEUR(summary.balanceAfterDossier)}
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
              {paymentOptions.map(({ value, icon: Icon }) => (
                <OptionCard key={value} selected={selectedOption === value}>
                  <Label htmlFor={value} className="flex cursor-pointer items-start gap-3 p-4 font-normal">
                    <RadioGroupItem value={value} id={value} className="mt-1" />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Icon className="h-4 w-4 shrink-0 text-[hsl(var(--tint-gold-fg))]" aria-hidden />
                        {PAYMENT_OPTION_LABELS[value]}
                      </span>
                      <span className="block text-sm font-normal text-muted-foreground">
                        {PAYMENT_OPTION_DESCRIPTIONS[value]}
                      </span>
                    </span>
                  </Label>
                </OptionCard>
              ))}
            </RadioGroup>
          </div>

          {summary && summary.balanceAfterDossier > 0 && hasChequeBalance(selectedOption) && (
            <Alert>
              <Receipt className="h-4 w-4" />
              <AlertDescription className="space-y-1 text-sm">
                <p className="font-medium">
                  Chèque de {formatPriceEUR(summary.balanceAfterDossier)} à envoyer avec votre inscription
                </p>
                <p className="text-muted-foreground">{CHEQUE_BALANCE_INSTRUCTION}</p>
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
