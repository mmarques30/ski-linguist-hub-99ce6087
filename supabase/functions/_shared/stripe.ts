const SIGNATURE_TOLERANCE_SECONDS = 300;

export function getStripeMode(secretKey: string | undefined): "test" | "live" | null {
  if (!secretKey) return null;
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  return null;
}

export async function validateStripeSecretKey(
  secretKey: string
): Promise<{ valid: boolean; mode: "test" | "live" | null; error?: string }> {
  const mode = getStripeMode(secretKey);
  if (!mode) {
    return { valid: false, mode: null, error: "Format de clé invalide (attendu sk_test_... ou sk_live_...)" };
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        valid: false,
        mode,
        error: data?.error?.message || `Stripe API error (${response.status})`,
      };
    }
    return { valid: true, mode };
  } catch (error) {
    return {
      valid: false,
      mode,
      error: error instanceof Error ? error.message : "Impossible de contacter Stripe",
    };
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<boolean> {
  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      acc[key] = acc[key] ?? [];
      acc[key].push(value);
    }
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || signatures.length === 0) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const ageSeconds = Math.floor(Date.now() / 1000) - timestampSeconds;
  if (Math.abs(ageSeconds) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`)
  );
  const computed = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((sig) => timingSafeEqual(sig, computed));
}
