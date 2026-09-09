import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { stripeCorsHeaders as corsHeaders } from "../_shared/stripe.ts";
import { ensureStripeWebhookEndpoint } from "../_shared/provision-stripe-webhook.ts";
import { saveStripeWebhookSecret } from "../_shared/stripe-webhook-secret.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: claimsData.claims.sub,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ success: false, error: "STRIPE_SECRET_KEY manquant dans Supabase Secrets" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-webhook`;
    const result = await ensureStripeWebhookEndpoint(stripeSecretKey, webhookUrl);
    await saveStripeWebhookSecret(adminClient, result.secret, result.endpointId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          webhookUrl,
          endpointId: result.endpointId,
          created: result.created,
          webhookSecretConfigured: true,
          envSecretConfigured: Boolean(Deno.env.get("STRIPE_WEBHOOK_SECRET")),
          message: result.created
            ? "Webhook Stripe créé et secret enregistré."
            : "Webhook Stripe existant — secret régénéré et enregistré.",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("provision-stripe-webhook error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
