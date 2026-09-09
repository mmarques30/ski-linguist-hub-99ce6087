import { formatPriceEUR } from "@/lib/registration-offerings";

export const FRAIS_DOSSIER_EUR = 150;

export const REGISTRATION_PAYMENT_OPTIONS = {
  STRIPE_DEPOSIT_CHEQUE: "stripe_deposit_cheque",
  VIREMENT_DEPOSIT: "virement_deposit",
  STRIPE_FULL: "stripe_full",
  VIREMENT_FULL: "virement_full",
} as const;

export type RegistrationPaymentOption =
  (typeof REGISTRATION_PAYMENT_OPTIONS)[keyof typeof REGISTRATION_PAYMENT_OPTIONS];

export const FLI_BANK_DETAILS = {
  beneficiary: "France Langues International",
  iban: "FR76 1820 6004 4339 5412 7300 144",
  bic: "AGRIFRPP882",
  bank: "Crédit Agricole",
};

export interface RegistrationPaymentSummary {
  coursePrice: number;
  dossierFee: number;
  balanceAfterDossier: number;
  amountDueNow: number;
  amountDueNowLabel: string;
}

export function getRegistrationPaymentSummary(
  coursePrice: number,
  option: RegistrationPaymentOption
): RegistrationPaymentSummary {
  const dossierFee = FRAIS_DOSSIER_EUR;
  const balanceAfterDossier = Math.max(coursePrice - dossierFee, 0);

  if (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL ||
    option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL
  ) {
    return {
      coursePrice,
      dossierFee,
      balanceAfterDossier: 0,
      amountDueNow: coursePrice,
      amountDueNowLabel: "Paiement intégral",
    };
  }

  return {
    coursePrice,
    dossierFee,
    balanceAfterDossier,
    amountDueNow: dossierFee,
    amountDueNowLabel: "Frais de dossier",
  };
}

/** Libellé du solde chèque dans le récapitulatif paiement */
export const CHEQUE_BALANCE_SUMMARY_LABEL =
  "Solde par chèque (à envoyer à l'inscription)";

/** Instruction affichée lorsque le solde est réglé par chèque */
export const CHEQUE_BALANCE_INSTRUCTION =
  "Le chèque pour le solde est à envoyer lors de l'inscription. Il sera encaissé uniquement après la clôture de votre dossier.";

export const PAYMENT_OPTION_LABELS: Record<RegistrationPaymentOption, string> = {
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]:
    "150 € en ligne (Stripe) + solde par chèque à l'inscription",
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT]:
    "150 € par virement bancaire + solde par chèque à l'inscription",
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]: "Paiement intégral en ligne (Stripe)",
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL]: "Paiement intégral par virement bancaire",
};

export const PAYMENT_OPTION_DESCRIPTIONS: Record<RegistrationPaymentOption, string> = {
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]:
    `Réglez les frais de dossier maintenant par carte. ${CHEQUE_BALANCE_INSTRUCTION}`,
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT]:
    `Effectuez un virement de 150 € pour les frais de dossier. ${CHEQUE_BALANCE_INSTRUCTION}`,
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]:
    "Réglez la totalité du tarif formation en une seule fois par carte bancaire.",
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL]:
    "Effectuez un virement bancaire pour le montant total de la formation.",
};

export function formatPaymentBreakdown(summary: RegistrationPaymentSummary): string {
  const lines = [
    `Tarif formation : ${formatPriceEUR(summary.coursePrice)}`,
    `Frais de dossier (déduits du total) : ${formatPriceEUR(summary.dossierFee)}`,
  ];

  if (summary.balanceAfterDossier > 0) {
    lines.push(
      `${CHEQUE_BALANCE_SUMMARY_LABEL} : ${formatPriceEUR(summary.balanceAfterDossier)} (encaissement après clôture du dossier)`
    );
  }

  lines.push(`À régler maintenant : ${formatPriceEUR(summary.amountDueNow)}`);
  return lines.join("\n");
}

export function requiresStripeCheckout(option: RegistrationPaymentOption): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE ||
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL
  );
}

export function requiresVirementInstructions(option: RegistrationPaymentOption): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT ||
    option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL
  );
}

export function hasChequeBalance(option: RegistrationPaymentOption): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE ||
    option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT
  );
}
