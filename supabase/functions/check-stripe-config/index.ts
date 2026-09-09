import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getStripeMode, stripeCorsHeaders as corsHeaders, validateStripeKey } from "../_shared/stripe.ts";
import { isStripeWebhookSecretConfigured } from "../_shared/stripe-webhook-secret.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const webhookUrl = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-webhook`
    : null;

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const supabase = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const webhookSecretConfigured = await isStripeWebhookSecretConfigured(supabase);
  const webhookSecretFromEnv = Boolean(Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  const validation = secretKey ? await validateStripeKey(secretKey) : { valid: false, mode: null };
  const mode = validation.mode ?? getStripeMode(secretKey);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        secretKeyConfigured: Boolean(secretKey),
        secretKeyValid: validation.valid,
        secretKeyError: validation.valid ? null : validation.error ?? null,
        webhookSecretConfigured,
        webhookSecretFromEnv,
        webhookSecretFromSettings: webhookSecretConfigured && !webhookSecretFromEnv,
        mode,
        configured: Boolean(secretKey) && validation.valid && webhookSecretConfigured,
        webhookUrl,
        checkoutFunction: "create-registration-checkout",
        verifyCheckoutFunction: "verify-registration-checkout",
        provisionWebhookFunction: "provision-stripe-webhook",
        webhookFunction: "stripe-webhook",
        requiredEvents: ["checkout.session.completed"],
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
