import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { stripeCorsHeaders as corsHeaders, verifyStripeSignature } from "../_shared/stripe.ts";
import { isValidPaymentOption } from "../_shared/registration-payments.ts";
import { recordStripeCheckoutPayment } from "../_shared/record-stripe-checkout-payment.ts";
import { getStripeWebhookSecret } from "../_shared/stripe-webhook-secret.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response("Stripe not configured", { status: 503 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const webhookSecret = await getStripeWebhookSecret(supabase);
    if (!webhookSecret) {
      return new Response("Stripe webhook secret not configured", { status: 503 });
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
    const paymentOption = session.metadata?.payment_option;

    if (!session.metadata?.inscription_id || !paymentOption || !isValidPaymentOption(paymentOption)) {
      return new Response("Missing metadata", { status: 400 });
    }

    const result = await recordStripeCheckoutPayment(supabase, session);

    return new Response(
      JSON.stringify({ received: true, duplicate: result.duplicate, recorded: result.recorded }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("stripe-webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
