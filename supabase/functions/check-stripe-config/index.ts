import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getStripeMode, stripeCorsHeaders as corsHeaders, validateStripeKey } from "../_shared/stripe.ts";
import {
  getStoredStripeWebhookSecretRecord,
  isStripeWebhookSecretConfigured,
} from "../_shared/stripe-webhook-secret.ts";
import {
  inspectStripeWebhookEndpoint,
  STRIPE_WEBHOOK_REQUIRED_EVENTS,
} from "../_shared/provision-stripe-webhook.ts";

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
  const webhookSecretFromEnv = Boolean(Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  const storedRecord = await getStoredStripeWebhookSecretRecord(supabase);
  const webhookSecretConfigured = await isStripeWebhookSecretConfigured(supabase);
  const validation = secretKey ? await validateStripeKey(secretKey) : { valid: false, mode: null };
  const mode = validation.mode ?? getStripeMode(secretKey);

  let webhookEndpointExists = false;
  let webhookEndpointId: string | null = null;
  let webhookEndpointStatus: string | null = null;
  let webhookHasRequiredEvents = false;
  let webhookEndpointCount = 0;
  let webhookEndpointError: string | null = null;

  if (secretKey && validation.valid && webhookUrl) {
    try {
      const inspection = await inspectStripeWebhookEndpoint(secretKey, webhookUrl);
      webhookEndpointExists = inspection.endpointExists;
      webhookEndpointId = inspection.endpointId;
      webhookEndpointStatus = inspection.endpointStatus;
      webhookHasRequiredEvents = inspection.hasRequiredEvents;
      webhookEndpointCount = inspection.endpointCount;
    } catch (error) {
      webhookEndpointError =
        error instanceof Error ? error.message : "Impossible de lister les webhooks Stripe";
    }
  }

  const storedMode = storedRecord?.mode ?? null;
  const webhookModeMismatch = Boolean(
    mode && storedMode && storedMode !== mode
  );

  // Un secret en base ne suffit plus : l'endpoint doit exister dans le mode de la clé.
  const webhookOperational =
    webhookSecretConfigured &&
    webhookEndpointExists &&
    webhookHasRequiredEvents &&
    !webhookModeMismatch &&
    !webhookEndpointError;

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
        webhookEndpointExists,
        webhookEndpointId,
        webhookEndpointStatus,
        webhookHasRequiredEvents,
        webhookEndpointCount,
        webhookEndpointError,
        webhookModeMismatch,
        storedWebhookMode: storedMode,
        storedWebhookEndpointId: storedRecord?.endpoint_id ?? null,
        mode,
        configured: Boolean(secretKey) && validation.valid && webhookOperational,
        webhookUrl,
        checkoutFunction: "create-registration-checkout",
        verifyCheckoutFunction: "verify-registration-checkout",
        provisionWebhookFunction: "provision-stripe-webhook",
        webhookFunction: "stripe-webhook",
        requiredEvents: [...STRIPE_WEBHOOK_REQUIRED_EVENTS],
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
