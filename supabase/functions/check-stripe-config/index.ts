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

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        secretKeyConfigured: Boolean(Deno.env.get("STRIPE_SECRET_KEY")),
        webhookSecretConfigured: Boolean(Deno.env.get("STRIPE_WEBHOOK_SECRET")),
        webhookUrl,
        checkoutFunction: "create-registration-checkout",
        webhookFunction: "stripe-webhook",
        requiredEvents: ["checkout.session.completed"],
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
