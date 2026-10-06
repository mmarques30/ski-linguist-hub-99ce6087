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
  SCHOOL_FIFPL_CHEQUE: "school_fifpl_cheque",
} as const;

export type RegistrationPaymentOption =
  (typeof REGISTRATION_PAYMENT_OPTIONS)[keyof typeof REGISTRATION_PAYMENT_OPTIONS];

const LEGACY_VIREMENT = "virement";

export function isStripe4xEligible(amountEur: number): boolean {
  return Number.isFinite(amountEur) && amountEur >= STRIPE_4X_MIN_EUR;
}

/** Échéance indicative (affichage) — Alma peut ajuster le 1er prélèvement. */
export function stripe4xInstallmentEur(totalEur: number): number {
  return Math.round((totalEur / STRIPE_4X_INSTALLMENTS) * 100) / 100;
}

export function isValidPaymentOption(value: string): value is RegistrationPaymentOption {
  return (
    Object.values(REGISTRATION_PAYMENT_OPTIONS).includes(value as RegistrationPaymentOption) ||
    value === LEGACY_VIREMENT
  );
}

export function normalizePaymentOption(value: string): RegistrationPaymentOption {
  if (value === LEGACY_VIREMENT) {
    return REGISTRATION_PAYMENT_OPTIONS.VIREMENT_DEPOSIT;
  }
  return value as RegistrationPaymentOption;
}

/** Paiement en ligne qui solde la part stagiaire (intégral ou 4× Alma). */
export function isStripeTotalSettlement(
  option: RegistrationPaymentOption | null | undefined
): boolean {
  return (
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL ||
    option === REGISTRATION_PAYMENT_OPTIONS.STRIPE_4X
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

export type StripeCheckoutPaymentMethodType = "card" | "klarna" | "alma";

export async function createStripeCheckoutSession(params: {
  stripeSecretKey: string;
  amountEur: number;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  /** Carte + Klarna par défaut ; Alma seul pour le parcours 4×. */
  paymentMethodTypes?: StripeCheckoutPaymentMethodType[];
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    locale: "fr",
    // Adresse de facturation : utile pour Klarna / Alma (éligibilité / pays acheteur).
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
