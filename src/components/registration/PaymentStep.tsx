import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Landmark, Receipt } from "lucide-react";
import type { RegistrationData } from "@/pages/register/Index";
import {
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
  const coursePrice = data.price ?? 0;
  const hasPrice = coursePrice > 0;

  const selectedOption =
    data.paymentOption ?? REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE;

  const summary = useMemo(
    () => (hasPrice ? getRegistrationPaymentSummary(coursePrice, selectedOption) : null),
    [coursePrice, hasPrice, selectedOption]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomFormat && hasPrice && !data.paymentOption) {
      onUpdate({ paymentOption: REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE });
    }
    onNext();
  };

  if (isCustomFormat || !hasPrice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paiement</CardTitle>
          <CardDescription>
            Format sur devis — les modalités de paiement vous seront communiquées avec la
            proposition commerciale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Pour les formats personnalisés, aucun règlement n&apos;est demandé à cette étape.
              Les frais de dossier ({formatPriceEUR(FRAIS_DOSSIER_EUR)}) seront précisés dans le
              devis.
            </AlertDescription>
          </Alert>
          <Button type="button" onClick={onNext} className="w-full mt-6">
            Continuer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frais de dossier et paiement</CardTitle>
        <CardDescription>
          Les frais de dossier de {formatPriceEUR(FRAIS_DOSSIER_EUR)} sont déduits du tarif total
          de la formation ({formatPriceEUR(coursePrice)}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {summary && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarif formation</span>
                <span className="font-medium">{formatPriceEUR(summary.coursePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de dossier (déduits)</span>
                <span className="font-medium">− {formatPriceEUR(summary.dossierFee)}</span>
              </div>
              {summary.balanceAfterDossier > 0 && hasChequeBalance(selectedOption) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Solde (chèque après formation)</span>
                  <span className="font-medium">{formatPriceEUR(summary.balanceAfterDossier)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>À régler maintenant</span>
                <span>{formatPriceEUR(summary.amountDueNow)}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label>Choisissez votre mode de règlement</Label>
            <RadioGroup
              value={selectedOption}
              onValueChange={(value) =>
                onUpdate({ paymentOption: value as RegistrationPaymentOption })
              }
              className="space-y-3"
            >
              {paymentOptions.map(({ value, icon: Icon }) => (
                <div
                  key={value}
                  className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={value} id={value} className="mt-1" />
                  <Label htmlFor={value} className="cursor-pointer flex-1 space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4 text-primary" />
                      {PAYMENT_OPTION_LABELS[value]}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal">
                      {PAYMENT_OPTION_DESCRIPTIONS[value]}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {requiresVirementInstructions(selectedOption) && (
            <Alert>
              <Landmark className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-1">
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
                <p className="text-muted-foreground">
                  IBAN : {FLI_BANK_DETAILS.iban} · BIC : {FLI_BANK_DETAILS.bic}
                </p>
                {selectedOption === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT && (
                  <p className="text-muted-foreground">
                    Le solde sera réglé par chèque, déposé après la fin de la formation.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={!selectedOption}>
            Continuer vers la confirmation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
