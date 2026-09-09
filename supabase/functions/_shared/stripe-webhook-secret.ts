import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_SETTINGS_KEY = "stripe_webhook_secret";

export async function getStripeWebhookSecret(
  supabase: SupabaseClient
): Promise<string | null> {
  const envSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (envSecret) return envSecret;

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", APP_SETTINGS_KEY)
    .maybeSingle();

  const stored = data?.value;
  if (typeof stored === "string" && stored.startsWith("whsec_")) {
    return stored;
  }
  if (stored && typeof stored === "object" && "secret" in stored) {
    const secret = (stored as { secret?: string }).secret;
    if (secret?.startsWith("whsec_")) return secret;
  }

  return null;
}

export async function saveStripeWebhookSecret(
  supabase: SupabaseClient,
  secret: string,
  endpointId: string
): Promise<void> {
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: APP_SETTINGS_KEY,
      value: { secret, endpoint_id: endpointId },
      description: "Stripe webhook signing secret (checkout.session.completed)",
    },
    { onConflict: "key" }
  );

  if (error) throw error;
}

export async function isStripeWebhookSecretConfigured(
  supabase: SupabaseClient
): Promise<boolean> {
  return Boolean(await getStripeWebhookSecret(supabase));
}
