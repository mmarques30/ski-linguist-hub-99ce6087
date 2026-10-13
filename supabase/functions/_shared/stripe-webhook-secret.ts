import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_SETTINGS_KEY = "stripe_webhook_secret";

export type StripeWebhookSecretRecord = {
  secret: string;
  endpoint_id: string;
  mode?: "test" | "live" | null;
};

function parseStoredSecret(stored: unknown): StripeWebhookSecretRecord | null {
  if (typeof stored === "string" && stored.startsWith("whsec_")) {
    return { secret: stored, endpoint_id: "unknown", mode: null };
  }
  if (stored && typeof stored === "object" && "secret" in stored) {
    const secret = (stored as { secret?: string }).secret;
    if (!secret?.startsWith("whsec_")) return null;
    const endpointId = (stored as { endpoint_id?: string }).endpoint_id;
    const mode = (stored as { mode?: string }).mode;
    return {
      secret,
      endpoint_id: typeof endpointId === "string" ? endpointId : "unknown",
      mode: mode === "test" || mode === "live" ? mode : null,
    };
  }
  return null;
}

export async function getStoredStripeWebhookSecretRecord(
  supabase: SupabaseClient
): Promise<StripeWebhookSecretRecord | null> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", APP_SETTINGS_KEY)
    .maybeSingle();

  return parseStoredSecret(data?.value);
}

export async function getStripeWebhookSecret(
  supabase: SupabaseClient
): Promise<string | null> {
  const envSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (envSecret) return envSecret;

  const stored = await getStoredStripeWebhookSecretRecord(supabase);
  return stored?.secret ?? null;
}

export async function saveStripeWebhookSecret(
  supabase: SupabaseClient,
  secret: string,
  endpointId: string,
  mode: "test" | "live" | null = null
): Promise<void> {
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: APP_SETTINGS_KEY,
      value: { secret, endpoint_id: endpointId, mode },
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
