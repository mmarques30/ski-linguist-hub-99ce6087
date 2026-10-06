export const FRAIS_DOSSIER_EUR = 150;

/**
 * Seuil Paula : option « 3 fois avec Klarna » à partir de 500 € (part / tarif).
 * Alma est inéligible (secteur éducation) — Klarna seul BNPL Stripe pour FLI.
 */
export const STRIPE_KLARNA_3X_MIN_EUR = 500;
export const STRIPE_KLARNA_3X_INSTALLMENTS = 3;

export const REGISTRATION_PAYMENT_OPTIONS = {
  STRIPE_DEPOSIT_CHEQUE: "stripe_deposit_cheque",
  VIREMENT_DEPOSIT: "virement_deposit",
  STRIPE_FULL: "stripe_full",
  /** Payez en 3 fois avec Klarna — stagiaire individuel, montant ≥ 500 €. */
  STRIPE_KLARNA_3X: "stripe_klarna_3x",
  VIREMENT_FULL: "virement_full",
  SCHOOL_FIFPL_CHEQUE: "school_fifpl_cheque",
} as const;

export type RegistrationPaymentOption =
  (typeof REGISTRATION_PAYMENT_OPTIONS)[keyof typeof REGISTRATION_PAYMENT_OPTIONS];

const LEGACY_VIREMENT = "virement";
/** Ancien code Alma 4× (jamais déployé en prod utile) → Klarna 3×. */
const LEGACY_STRIPE_4X = "stripe_4x";

export function isStripeKlarna3xEligibleAmount(amountEur: number): boolean {
  return Number.isFinite(amountEur) && amountEur >= STRIPE_KLARNA_3X_MIN_EUR;
}

/** Échéance indicative (affichage). */
export function stripeKlarna3xInstallmentEur(totalEur: number): number {
  return Math.round((totalEur / STRIPE_KLARNA_3X_INSTALLMENTS) * 100) / 100;
}

export function isValidPaymentOption(value: string): value is RegistrationPaymentOption {
  return (
    Object.values(REGISTRATION_PAYMENT_OPTIONS).includes(value as RegistrationPaymentOption) ||
    value === LEGACY_VIREMENT ||
    value === LEGACY_STRIPE_4X
  );
}

export function normalizePaymentOption(value: string): RegistrationPaymentOption {
  if (value === LEGACY_VIREMENT) {
    return REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT;
  }
  if (value === LEGACY_STRIPE_4X) {
    return REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X;
  }
  return value as RegistrationPaymentOption;
}

/** Paiement en ligne qui solde la part stagiaire (intégral ou 3× Klarna). */
export function isStripeTotalSettlement(
  option: RegistrationPaymentOption | null | undefined
): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL ||
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X
  );
}

export function getInscriptionPaymentFields(
  coursePrice: number,
  paymentOption: RegistrationPaymentOption
): {
  paymentMethod: string;
  balanceAfterDeposit: number;
  depositAmount: number | null;
  paymentFlow: "stripe" | "virement" | "none";
  paymentType: "acompte" | "total";
  stripeAmount: number;
  virementAmount: number;
} {
  const option = normalizePaymentOption(paymentOption);

  if (option === REGISTRATION_PAYMENT_OPTIONS.SCHOOL_FIFPL_CHEQUE) {
    return {
      paymentMethod: "cheque_fifpl_ecole",
      balanceAfterDeposit: coursePrice,
      depositAmount: null,
      paymentFlow: "none",
      paymentType: "total",
      stripeAmount: 0,
      virementAmount: 0,
    };
  }

  if (isStripeTotalSettlement(option)) {
    return {
      paymentMethod: "stripe",
      balanceAfterDeposit: 0,
      depositAmount: null,
      paymentFlow: "stripe",
      paymentType: "total",
      stripeAmount: coursePrice,
      virementAmount: 0,
    };
  }

  if (option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_FULL) {
    return {
      paymentMethod: "virement",
      balanceAfterDeposit: 0,
      depositAmount: null,
      paymentFlow: "virement",
      paymentType: "total",
      stripeAmount: 0,
      virementAmount: coursePrice,
    };
  }

  const balanceAfterDeposit = Math.max(coursePrice - FRAIS_DOSSIER_EUR, 0);

  if (option === REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT) {
    return {
      paymentMethod: "virement",
      balanceAfterDeposit,
      depositAmount: FRAIS_DOSSIER_EUR,
      paymentFlow: "virement",
      paymentType: "acompte",
      stripeAmount: 0,
      virementAmount: FRAIS_DOSSIER_EUR,
    };
  }

  return {
    paymentMethod: "cheque",
    balanceAfterDeposit,
    depositAmount: FRAIS_DOSSIER_EUR,
    paymentFlow: "stripe",
    paymentType: "acompte",
    stripeAmount: FRAIS_DOSSIER_EUR,
    virementAmount: 0,
  };
}

export type StripeCheckoutPaymentMethodType = "card" | "klarna";

export async function createStripeCheckoutSession(params: {
  stripeSecretKey: string;
  amountEur: number;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  /** Carte + Klarna par défaut ; Klarna seul pour le parcours « 3 fois ». */
  paymentMethodTypes?: StripeCheckoutPaymentMethodType[];
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    locale: "fr",
    // Adresse de facturation : utile pour Klarna (éligibilité / pays acheteur).
    billing_address_collection: "required",
    // Empêche Stripe de proposer une conversion USD selon le navigateur.
    "adaptive_pricing[enabled]": "false",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(Math.round(params.amountEur * 100)),
    "line_items[0][price_data][product_data][name]": params.productName,
    "line_items[0][quantity]": "1",
  });

  const paymentMethodTypes = params.paymentMethodTypes ?? ["card", "klarna"];
  for (const type of paymentMethodTypes) {
    body.append("payment_method_types[]", type);
  }

  for (const [key, value] of Object.entries(params.metadata)) {
    body.set(`metadata[${key}]`, value);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Stripe checkout session failed");
  }

  return { id: data.id as string, url: data.url as string };
}
