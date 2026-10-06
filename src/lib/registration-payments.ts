import {
  formatPriceEUR,
  hidesDepositPaymentOptions,
  type SessionFundingMode,
} from "@/lib/registration-offerings";

export const FRAIS_DOSSIER_EUR = 150;

/** Seuil Paula : option « 4 fois » proposée à partir de 500 € (part / tarif à régler). */
export const STRIPE_4X_MIN_EUR = 500;
export const STRIPE_4X_INSTALLMENTS = 4;

export const REGISTRATION_PAYMENT_OPTIONS = {
  STRIPE_DEPOSIT_CHEQUE: "stripe_deposit_cheque",
  VIREMENT_DEPOSIT: "virement_deposit",
  STRIPE_FULL: "stripe_full",
  /** Paiement en 4 fois via Alma (Checkout Stripe), montants ≥ STRIPE_4X_MIN_EUR. */
  STRIPE_4X: "stripe_4x",
  VIREMENT_FULL: "virement_full",
  /** Méribel / La Rosière : chèque FIF-PL via l'école, encaissé après la formation. */
  SCHOOL_FIFPL_CHEQUE: "school_fifpl_cheque",
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

export function isStripe4xEligible(amountEur: number): boolean {
  return Number.isFinite(amountEur) && amountEur >= STRIPE_4X_MIN_EUR;
}

/** Échéance indicative (affichage) — Alma peut ajuster le 1er prélèvement. */
export function stripe4xInstallmentEur(totalEur: number): number {
  return Math.round((totalEur / STRIPE_4X_INSTALLMENTS) * 100) / 100;
}

/** Options affichées selon le mode de financement session (SESSIONS §3.3 / §3.4 / §4.8). */
export function getAvailablePaymentOptions(
  fundingMode: SessionFundingMode = "individuel",
  payableAmountEur = 0
): RegistrationPaymentOption[] {
  const withFourTimes = (options: RegistrationPaymentOption[]): RegistrationPaymentOption[] => {
    if (!isStripe4xEligible(payableAmountEur)) return options;
    const fullIdx = options.indexOf(REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL);
    if (fullIdx < 0) return [...options, REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X];
    return [
      ...options.slice(0, fullIdx + 1),
      REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X,
      ...options.slice(fullIdx + 1),
    ];
  };

  if (hidesDepositPaymentOptions(fundingMode)) {
    return withFourTimes([
      REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL,
      REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL,
      REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE,
    ]);
  }
  return withFourTimes([
    REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE,
    REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT,
    REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL,
    REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL,
  ]);
}

export function getRegistrationPaymentSummary(
  coursePrice: number,
  option: RegistrationPaymentOption
): RegistrationPaymentSummary {
  if (option === REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE) {
    return {
      coursePrice,
      dossierFee: 0,
      balanceAfterDossier: coursePrice,
      amountDueNow: 0,
      amountDueNowLabel: "Aucun acompte — chèque FIF-PL via l'école",
    };
  }

  const dossierFee = FRAIS_DOSSIER_EUR;
  const balanceAfterDossier = Math.max(coursePrice - dossierFee, 0);

  if (option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X) {
    const installment = stripe4xInstallmentEur(coursePrice);
    return {
      coursePrice,
      dossierFee,
      balanceAfterDossier: 0,
      amountDueNow: coursePrice,
      amountDueNowLabel: `4 × ${formatPriceEUR(installment)}`,
    };
  }

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
  "Solde par chèque (avant le début de la formation)";

/** Instruction affichée lorsque le solde est réglé par chèque */
export const CHEQUE_BALANCE_INSTRUCTION =
  "Le chèque pour le solde est à envoyer avant le début de la formation.";

export const SCHOOL_FIFPL_CHEQUE_INSTRUCTION =
  "Remettez le chèque FIF-PL (montant de l'accord préalable) à votre école de ski. Il sera encaissé après la formation ; l'ESF règle le solde.";

export const PAYMENT_OPTION_LABELS: Record<RegistrationPaymentOption, string> = {
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]:
    "150 € paiement sécurisé en ligne + solde par chèque avant le début de la formation",
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT]:
    "150 € par virement bancaire + solde par chèque avant le début de la formation",
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]:
    "Paiement sécurisé en ligne — montant total",
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X]:
    "Paiement sécurisé en ligne en 4 fois",
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL]: "Paiement intégral par virement bancaire",
  [REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE]:
    "Prise en charge par mon école de ski, chèque FIF-PL à remettre",
};

export const PAYMENT_OPTION_DESCRIPTIONS: Record<RegistrationPaymentOption, string> = {
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE]:
    `Réglez les frais de dossier maintenant par paiement sécurisé en ligne (plusieurs fois si éligible). ${CHEQUE_BALANCE_INSTRUCTION}`,
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT]:
    `Effectuez un virement de 150 € pour les frais de dossier. ${CHEQUE_BALANCE_INSTRUCTION}`,
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL]:
    "Réglez la totalité de votre part (montant de l'accord préalable FIF-PL ou tarif formation) par paiement sécurisé en ligne (plusieurs fois si éligible).",
  [REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X]:
    `Répartissez le montant en 4 échéances via Alma (à partir de ${formatPriceEUR(STRIPE_4X_MIN_EUR)}). FLI est payé immédiatement ; Alma prélève ensuite les échéances.`,
  [REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL]:
    "Effectuez un virement bancaire pour le montant total de votre part.",
  [REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE]: SCHOOL_FIFPL_CHEQUE_INSTRUCTION,
};

export function formatPaymentBreakdown(summary: RegistrationPaymentSummary): string {
  const lines = [`Tarif / part formation : ${formatPriceEUR(summary.coursePrice)}`];

  if (summary.dossierFee > 0) {
    lines.push(`Frais de dossier (déduits du total) : ${formatPriceEUR(summary.dossierFee)}`);
  }

  if (summary.balanceAfterDossier > 0) {
    lines.push(
      `${CHEQUE_BALANCE_SUMMARY_LABEL} : ${formatPriceEUR(summary.balanceAfterDossier)}`
    );
  }

  lines.push(`À régler maintenant : ${formatPriceEUR(summary.amountDueNow)}`);
  return lines.join("\n");
}

/**
 * Aucun mode de règlement n'est coché par défaut dans `/register` (décision Paula) :
 * ces trois prédicats acceptent donc l'absence de choix.
 */
export type MaybePaymentOption = RegistrationPaymentOption | null | undefined;

export function requiresStripeCheckout(option: MaybePaymentOption): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE ||
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL ||
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X
  );
}

/** Paiement en ligne qui solde la part stagiaire (intégral ou 4× Alma). */
export function isStripeTotalSettlement(option: MaybePaymentOption): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL ||
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X
  );
}

export function requiresVirementInstructions(option: MaybePaymentOption): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT ||
    option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL
  );
}

export function hasChequeBalance(option: MaybePaymentOption): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE ||
    option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT ||
    option === REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE
  );
}

export function isSchoolFifplCheque(option: MaybePaymentOption): boolean {
  return option === REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE;
}
