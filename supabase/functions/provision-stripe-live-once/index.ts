/**
 * One-shot — crée le webhook Stripe live + enregistre whsec_ (Paula, 25/09/2026).
 * Utilise STRIPE_SECRET_KEY (secret Edge). Undeploy immédiatement après.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getStripeMode } from "../_shared/stripe.ts";
import { ensureStripeWebhookEndpoint } from "../_shared/provision-stripe-webhook.ts";
import { saveStripeWebhookSecret } from "../_shared/stripe-webhook-secret.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ success: false, error: "STRIPE_SECRET_KEY absente" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mode = getStripeMode(stripeSecretKey);
    if (mode !== "live") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Clé en mode ${mode ?? "inconnu"} — attendu live`,
          mode,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const webhookUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-webhook`;

    const result = await ensureStripeWebhookEndpoint(stripeSecretKey, webhookUrl);
    await saveStripeWebhookSecret(adminClient, result.secret, result.endpointId, mode);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        webhookUrl,
        endpointId: result.endpointId,
        created: result.created,
        secretPrefix: result.secret.slice(0, 10),
        message: result.created
          ? "Webhook live créé et secret enregistré."
          : "Webhook live existant — secret régénéré et enregistré.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
