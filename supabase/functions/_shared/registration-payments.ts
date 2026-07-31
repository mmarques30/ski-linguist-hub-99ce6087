export const FRAIS_DOSSIER_EUR = 150;

export const REGISTRATION_PAYMENT_OPTIONS = {
  STRIPE_DEPOSIT_CHEQUE: "stripe_deposit_cheque",
  VIREMENT: "virement",
  STRIPE_FULL: "stripe_full",
} as const;

export type RegistrationPaymentOption =
  (typeof REGISTRATION_PAYMENT_OPTIONS)[keyof typeof REGISTRATION_PAYMENT_OPTIONS];

export function isValidPaymentOption(value: string): value is RegistrationPaymentOption {
  return Object.values(REGISTRATION_PAYMENT_OPTIONS).includes(value as RegistrationPaymentOption);
}

export function getInscriptionPaymentFields(
  coursePrice: number,
  paymentOption: RegistrationPaymentOption
): {
  paymentMethod: string;
  balanceAfterDeposit: number;
  depositAmount: number | null;
  paymentFlow: "stripe" | "virement";
  paymentType: "acompte" | "total";
  stripeAmount: number;
} {
  if (paymentOption === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL) {
    return {
      paymentMethod: "stripe",
      balanceAfterDeposit: 0,
      depositAmount: null,
      paymentFlow: "stripe",
      paymentType: "total",
      stripeAmount: coursePrice,
    };
  }

  const balanceAfterDeposit = Math.max(coursePrice - FRAIS_DOSSIER_EUR, 0);

  if (paymentOption === REGISTRATION_PAYMENT_OPTIONS.VIREMENT) {
    return {
      paymentMethod: "virement",
      balanceAfterDeposit,
      depositAmount: null,
      paymentFlow: "virement",
      paymentType: "acompte",
      stripeAmount: FRAIS_DOSSIER_EUR,
    };
  }

  return {
    paymentMethod: "cheque",
    balanceAfterDeposit,
    depositAmount: null,
    paymentFlow: "stripe",
    paymentType: "acompte",
    stripeAmount: FRAIS_DOSSIER_EUR,
  };
}

export async function createStripeCheckoutSession(params: {
  stripeSecretKey: string;
  amountEur: number;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(Math.round(params.amountEur * 100)),
    "line_items[0][price_data][product_data][name]": params.productName,
    "line_items[0][quantity]": "1",
  });

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
