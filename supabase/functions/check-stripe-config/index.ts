import { getStripeMode, stripeCorsHeaders as corsHeaders, validateStripeKey } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const webhookUrl = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-webhook`
    : null;

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const webhookSecretConfigured = Boolean(Deno.env.get("STRIPE_WEBHOOK_SECRET"));
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
        mode,
        configured: Boolean(secretKey) && validation.valid && webhookSecretConfigured,
        webhookUrl,
        checkoutFunction: "create-registration-checkout",
        webhookFunction: "stripe-webhook",
        requiredEvents: ["checkout.session.completed"],
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
