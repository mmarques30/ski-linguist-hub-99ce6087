import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createStripeCheckoutSession,
  getInscriptionPaymentFields,
  isValidPaymentOption,
  normalizePaymentOption,
  REGISTRATION_PAYMENT_OPTIONS,
} from "../_shared/registration-payments.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inscriptionId, paymentOption, email, successUrl, cancelUrl } = await req.json();

    if (!inscriptionId || !paymentOption || !email || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Paramètres de paiement incomplets" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidPaymentOption(paymentOption)) {
      return new Response(
        JSON.stringify({ success: false, error: "Mode de paiement invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedOption = normalizePaymentOption(paymentOption);

    if (
      normalizedOption !== REGISTRATION_PAYMENT_OPTIONS.STRIPE_DEPOSIT_CHEQUE &&
      normalizedOption !== REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Ce mode de paiement ne nécessite pas Stripe" }),
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: inscription, error: inscriptionError } = await supabase
      .from("inscriptions")
      .select("id, code, price, student_id")
      .eq("id", inscriptionId)
      .maybeSingle();

    if (inscriptionError || !inscription) {
      return new Response(
        JSON.stringify({ success: false, error: "Inscription introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: student } = await supabase
      .from("students")
      .select("email")
      .eq("id", inscription.student_id)
      .maybeSingle();

    const studentEmail = student?.email?.toLowerCase();
    if (studentEmail !== String(email).trim().toLowerCase()) {
      return new Response(
        JSON.stringify({ success: false, error: "Email non correspondant à l'inscription" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coursePrice = Number(inscription.price) || 0;
    if (coursePrice <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Montant de formation invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentFields = getInscriptionPaymentFields(coursePrice, normalizedOption);
    const productName =
      normalizedOption === REGISTRATION_PAYMENT_OPTIONS.STRIPE_FULL
        ? `Formation FLI — ${inscription.code}`
        : `Frais de dossier FLI — ${inscription.code}`;

    const session = await createStripeCheckoutSession({
      stripeSecretKey,
      amountEur: paymentFields.stripeAmount,
      productName,
      customerEmail: email,
      successUrl,
      cancelUrl,
      metadata: {
        inscription_id: inscriptionId,
        payment_option: normalizedOption,
        payment_type: paymentFields.paymentType,
        inscription_code: inscription.code || "",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { checkoutUrl: session.url, sessionId: session.id },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-registration-checkout error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
