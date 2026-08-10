import { getStripeMode, validateStripeSecretKey } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const webhookUrl = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-webhook`
    : null;

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const hasSecretKey = Boolean(secretKey);
  const hasWebhookSecret = Boolean(Deno.env.get("STRIPE_WEBHOOK_SECRET"));

  let keyValid = false;
  let mode: "test" | "live" | null = getStripeMode(secretKey);
  let keyError: string | undefined;

  if (hasSecretKey) {
    const validation = await validateStripeSecretKey(secretKey);
    keyValid = validation.valid;
    mode = validation.mode;
    keyError = validation.error;
  }

  const configured = hasSecretKey && hasWebhookSecret && keyValid;

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        secretKeyConfigured: hasSecretKey,
        webhookSecretConfigured: hasWebhookSecret,
        hasSecretKey,
        hasWebhookSecret,
        keyValid,
        mode,
        configured,
        keyError,
        webhookUrl,
        checkoutFunction: "create-registration-checkout",
        webhookFunction: "stripe-webhook",
        requiredEvents: ["checkout.session.completed"],
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
