import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getInscriptionPaymentFields,
  isStripeTotalSettlement,
  normalizePaymentOption,
  REGISTRATION_PAYMENT_OPTIONS,
  resolveStripeCheckoutAmountEur,
  type RegistrationPaymentOption,
} from "./registration-payments.ts";
import { enqueueInscriptionDocuments } from "./enqueue-inscription-documents.ts";
import { paymentTriggersDocumentEnqueue } from "./funding-flows.ts";

export interface StripeCheckoutSessionLike {
  id: string;
  status?: string | null;
  payment_status?: string;
  amount_total?: number | null;
  payment_intent?: string | null;
  metadata?: Record<string, string | undefined>;
}

const AMOUNT_TOLERANCE_EUR = 0.01;

function amountsMatchEur(paid: number, expected: number): boolean {
  return Math.abs(paid - expected) <= AMOUNT_TOLERANCE_EUR;
}

/**
 * Montant attendu pour la session : métadonnée posée à la création du checkout,
 * sinon recalcul depuis le tarif inscription + option de paiement.
 */
export function expectedStripeCheckoutAmountEur(input: {
  coursePrice: number;
  balanceAfterDeposit?: number | null;
  paymentOption: RegistrationPaymentOption;
  metadataAmountEur?: string | null;
}): number {
  const fromMeta = Number(input.metadataAmountEur);
  if (Number.isFinite(fromMeta) && fromMeta > 0) {
    return fromMeta;
  }
  return resolveStripeCheckoutAmountEur({
    coursePrice: input.coursePrice,
    balanceAfterDeposit: input.balanceAfterDeposit,
    paymentOption: input.paymentOption,
  });
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

  if (session.payment_status !== "paid") {
    throw new Error("Session Stripe non payée");
  }

  // Stripe Checkout : status « complete » une fois payé (pas « paid »).
  if (session.status && session.status !== "complete") {
    throw new Error("Session Stripe non finalisée");
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
    .select("id, price, code, funding_organization, balance_after_deposit")
    .eq("id", inscriptionId)
    .maybeSingle();

  if (!inscription) {
    throw new Error("Inscription introuvable");
  }

  const coursePrice = Number(inscription.price) || 0;
  const paymentFields = getInscriptionPaymentFields(coursePrice, normalizedOption);
  const amountPaid = (session.amount_total || 0) / 100;
  const expectedAmount = expectedStripeCheckoutAmountEur({
    coursePrice,
    balanceAfterDeposit: inscription.balance_after_deposit,
    paymentOption: normalizedOption,
    metadataAmountEur: session.metadata?.stripe_amount_eur,
  });

  if (!amountsMatchEur(amountPaid, expectedAmount)) {
    throw new Error(
      `Montant Stripe (${amountPaid} €) différent du montant attendu (${expectedAmount} €)`
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const settledTotal = isStripeTotalSettlement(normalizedOption);
  const resolvedPaymentType =
    paymentType === "acompte" || paymentType === "total"
      ? paymentType
      : settledTotal
        ? "total"
        : "acompte";

  const paymentNotes =
    normalizedOption === REGISTRATION_PAYMENT_OPTIONS.STRIPE_KLARNA_3X
      ? "Paiement en 3 fois (Klarna) — inscription en ligne"
      : settledTotal
        ? "Paiement intégral inscription en ligne"
        : "Frais de dossier inscription en ligne";

  await supabase.from("payments").insert({
    inscription_id: inscriptionId,
    amount: amountPaid,
    payment_type: resolvedPaymentType,
    payment_method: "stripe",
    status: "recu",
    payment_date: today,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent,
    reference: inscription.code,
    payer_type: "stagiaire",
    notes: paymentNotes,
  });

  const depositAmount = amountPaid;
  const balanceAfterDeposit = settledTotal ? 0 : paymentFields.balanceAfterDeposit;

  await supabase
    .from("inscriptions")
    .update({
      payment_method: paymentFields.paymentMethod,
      deposit_amount: depositAmount,
      deposit_date: today,
      balance_after_deposit: balanceAfterDeposit,
      status: settledTotal ? "confirmee" : undefined,
    })
    .eq("id", inscriptionId);

  // Dossier : FIFPL / AGEFICE / Autofinancement après 150 € ou total.
  try {
    const fundingOrganization = inscription.funding_organization ?? null;
    if (
      paymentTriggersDocumentEnqueue(fundingOrganization, {
        status: "recu",
        amount: amountPaid,
        payment_type: resolvedPaymentType,
      })
    ) {
      await enqueueInscriptionDocuments({
        supabase,
        inscriptionId,
        fundingOrganization,
      });
    }
  } catch (docError) {
    console.error("enqueue inscription_documents after Stripe:", docError);
  }

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
