import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getInscriptionPaymentFields,
  isValidPaymentOption,
  normalizePaymentOption,
  REGISTRATION_PAYMENT_OPTIONS,
} from "../_shared/registration-payments.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const expectedSig = parts.v1;
  if (!timestamp || !expectedSig) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`)
  );
  const computed = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === expectedSig;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeSecretKey || !webhookSecret) {
      return new Response("Stripe not configured", { status: 503 });
    }

    const signature = req.headers.get("stripe-signature");
    const payload = await req.text();
    if (!signature || !(await verifyStripeSignature(payload, signature, webhookSecret))) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(payload);
    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data.object;
    const inscriptionId = session.metadata?.inscription_id;
    const paymentOption = session.metadata?.payment_option;
    const paymentType = session.metadata?.payment_type || "acompte";

    if (!inscriptionId || !paymentOption || !isValidPaymentOption(paymentOption)) {
      return new Response("Missing metadata", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (existingPayment) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: inscription } = await supabase
      .from("inscriptions")
      .select("id, price, code")
      .eq("id", inscriptionId)
      .maybeSingle();

    if (!inscription) {
      return new Response("Inscription not found", { status: 404 });
    }

    const coursePrice = Number(inscription.price) || 0;
    const normalizedOption = normalizePaymentOption(paymentOption);
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
      normalizedOption === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL ? 0 : paymentFields.balanceAfterDeposit;

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

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
