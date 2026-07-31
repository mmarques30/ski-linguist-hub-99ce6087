const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  const hasSecretKey = secretKey.length > 0;
  const hasWebhookSecret = webhookSecret.length > 0;

  let keyValid: boolean | null = null;
  let mode: "test" | "live" | null = null;

  if (hasSecretKey) {
    mode = secretKey.startsWith("sk_live_") ? "live" : "test";
    try {
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      keyValid = res.ok;
      await res.text();
    } catch (_e) {
      keyValid = false;
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        hasSecretKey,
        hasWebhookSecret,
        keyValid,
        mode,
        configured: hasSecretKey && hasWebhookSecret && keyValid === true,
        webhookUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe-webhook`,
        requiredEvents: ["checkout.session.completed"],
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});