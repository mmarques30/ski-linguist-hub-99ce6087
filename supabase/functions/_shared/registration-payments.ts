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

/** Aligné sur `src/lib/registration-payments.ts` — RIB FLI. */
export const FLI_BANK_DETAILS = {
  beneficiary: "France Langues International",
  iban: "FR76 1820 6004 4339 5412 7300 144",
  bic: "AGRIFRPP882",
  bank: "Crédit Agricole",
};

/**
 * Bloc HTML RIB FLI pour les e-mails.
 * Règle Paula (08/10/2026) : dès qu'un lien de paiement part, joindre aussi
 * ces coordonnées bancaires (alternative virement).
 */
export function buildFliBankDetailsEmailHtml(reference?: string | null): string {
  const ref = (reference || "").trim();
  const refLine = ref
    ? `<p style="margin:0 0 4px">Référence à indiquer&nbsp;: <strong>${ref}</strong></p>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;font-size:15px;background:#f9f9f9;width:100%">
<tr><td style="padding:12px 14px">
<p style="margin:0 0 6px"><strong>Coordonnées bancaires FLI</strong></p>
<p style="margin:0 0 4px">Bénéficiaire&nbsp;: ${FLI_BANK_DETAILS.beneficiary}</p>
<p style="margin:0 0 4px">IBAN&nbsp;: ${FLI_BANK_DETAILS.iban}</p>
<p style="margin:0 0 4px">BIC&nbsp;: ${FLI_BANK_DETAILS.bic}</p>
<p style="margin:0 0 4px">Banque&nbsp;: ${FLI_BANK_DETAILS.bank}</p>
${refLine}
</td></tr>
</table>`;
}

/**
 * Lien de paiement Stripe + RIB (toujours les deux).
 * À utiliser pour tout e-mail qui propose un checkout en ligne.
 */
export function buildPaymentLinkWithBankDetailsEmailHtml(input: {
  checkoutUrl: string;
  amountLabel: string;
  reference?: string | null;
  onlineIntroHtml?: string;
}): string {
  const url = input.checkoutUrl.trim();
  if (!url) {
    throw new Error("buildPaymentLinkWithBankDetailsEmailHtml: checkoutUrl requis");
  }
  const intro =
    input.onlineIntroHtml?.trim() ||
    `Pour régler <strong>${input.amountLabel}</strong> en ligne (carte ou Klarna), utilisez ce lien sécurisé&nbsp;:`;
  return `<p style="margin:0 0 12px">${intro}<br/><a href="${url}" style="color:#111">${url}</a></p>
<p style="margin:0 0 12px">Vous pouvez aussi régler par virement&nbsp;:</p>
${buildFliBankDetailsEmailHtml(input.reference)}`;
}

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

/**
 * Montant Stripe pour un règlement intégral / Klarna 3×.
 * Si `balance_after_deposit` est une part stagiaire strictement inférieure au
 * tarif formation (ex. La Rosière : 900 € / 1 500 €), on facture cette part
 * — jamais le forfait école.
 */
export function resolveStripeCheckoutAmountEur(input: {
  coursePrice: number;
  balanceAfterDeposit?: number | null;
  paymentOption: RegistrationPaymentOption;
}): number {
  const fields = getInscriptionPaymentFields(
    input.coursePrice,
    input.paymentOption
  );
  if (!isStripeTotalSettlement(input.paymentOption)) {
    return fields.stripeAmount;
  }
  const share = Number(input.balanceAfterDeposit);
  if (Number.isFinite(share) && share > 0 && share < input.coursePrice) {
    return share;
  }
  return fields.stripeAmount;
}

/**
 * Part moniteur (chèque FIF-PL) pour Méribel / La Rosière.
 * Utilise l'estimation FIF-PL (`coveredOnCourseEur`) quand elle est connue ;
 * sinon le tarif formation (comportement historique).
 */
export function resolveSchoolFifplStudentShareEur(
  coursePrice: number,
  studentShareEur?: number | null
): number {
  const share = Number(studentShareEur);
  if (Number.isFinite(share) && share > 0 && share <= coursePrice) {
    return Math.round(share);
  }
  return coursePrice;
}

export function getInscriptionPaymentFields(
  coursePrice: number,
  paymentOption: RegistrationPaymentOption,
  options?: { studentShareEur?: number | null }
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
      balanceAfterDeposit: resolveSchoolFifplStudentShareEur(
        coursePrice,
        options?.studentShareEur
      ),
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
    // Acompte Stripe + solde chèque — pas « cheque » nu (convention PDF).
    paymentMethod: "stripe_deposit_cheque",
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
