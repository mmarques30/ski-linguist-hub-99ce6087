import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { stripeCorsHeaders as corsHeaders } from "../_shared/stripe.ts";
import {
  recordStripeCheckoutPayment,
  retrieveStripeCheckoutSession,
} from "../_shared/record-stripe-checkout-payment.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "sessionId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Paiement en ligne non configuré" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await retrieveStripeCheckoutSession(stripeSecretKey, sessionId);
    const paymentStatus = session.payment_status || "unpaid";

    if (paymentStatus !== "paid") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            paymentStatus,
            recorded: false,
            inscriptionCode: session.metadata?.inscription_code || null,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result = await recordStripeCheckoutPayment(supabase, session);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          paymentStatus,
          recorded: result.recorded,
          duplicate: result.duplicate,
          inscriptionCode: session.metadata?.inscription_code || null,
          amountPaid: (session.amount_total || 0) / 100,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-registration-checkout error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
