import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getInscriptionPaymentFields,
  normalizePaymentOption,
  REGISTRATION_PAYMENT_OPTIONS,
  type RegistrationPaymentOption,
} from "./registration-payments.ts";

export interface StripeCheckoutSessionLike {
  id: string;
  payment_status?: string;
  amount_total?: number | null;
  payment_intent?: string | null;
  metadata?: Record<string, string | undefined>;
}

export async function recordStripeCheckoutPayment(
  supabase: SupabaseClient,
  session: StripeCheckoutSessionLike
): Promise<{ recorded: boolean; duplicate: boolean; inscriptionId?: string }> {
  const inscriptionId = session.metadata?.inscription_id;
  const paymentOption = session.metadata?.payment_option;
  const paymentType = session.metadata?.payment_type || "acompte";

  if (!inscriptionId || !paymentOption) {
    throw new Error("Session Stripe sans métadonnées d'inscription");
  }

  const normalizedOption = normalizePaymentOption(paymentOption) as RegistrationPaymentOption;

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingPayment) {
    return { recorded: false, duplicate: true, inscriptionId };
  }

  const { data: inscription } = await supabase
    .from("inscriptions")
    .select("id, price, code")
    .eq("id", inscriptionId)
    .maybeSingle();

  if (!inscription) {
    throw new Error("Inscription introuvable");
  }

  const coursePrice = Number(inscription.price) || 0;
  const paymentFields = getInscriptionPaymentFields(coursePrice, normalizedOption);
  const amountPaid = (session.amount_total || 0) / 100;
  const today = new Date().toISOString().split("T")[0];

  await supabase.from("payments").insert({
    inscription_id: inscriptionId,
    amount: amountPaid,
    payment_type: paymentType,
    payment_method: "stripe",
    status: "recu",
    payment_date: today,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent,
    reference: inscription.code,
    payer_type: "stagiaire",
    notes:
      normalizedOption === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL
        ? "Paiement intégral inscription en ligne"
        : "Frais de dossier inscription en ligne",
  });

  const depositAmount = amountPaid;
  const balanceAfterDeposit =
    normalizedOption === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL
      ? 0
      : paymentFields.balanceAfterDeposit;

  await supabase
    .from("inscriptions")
    .update({
      payment_method: paymentFields.paymentMethod,
      deposit_amount: depositAmount,
      deposit_date: today,
      balance_after_deposit: balanceAfterDeposit,
      status:
        normalizedOption === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL ? "confirmee" : undefined,
    })
    .eq("id", inscriptionId);

  return { recorded: true, duplicate: false, inscriptionId };
}

export async function retrieveStripeCheckoutSession(
  stripeSecretKey: string,
  sessionId: string
): Promise<StripeCheckoutSessionLike> {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${stripeSecretKey}` } }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Impossible de récupérer la session Stripe");
  }

  return data as StripeCheckoutSessionLike;
}
