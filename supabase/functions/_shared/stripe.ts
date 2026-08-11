export const stripeCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

export function getStripeMode(secretKey: string | undefined): "test" | "live" | null {
  if (!secretKey) return null;
  if (secretKey.startsWith("sk_live_") || secretKey.startsWith("rk_live_")) return "live";
  if (secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_")) return "test";
  return null;
}

export async function validateStripeKey(
  secretKey: string
): Promise<{ valid: boolean; mode: "test" | "live" | null; error?: string }> {
  const mode = getStripeMode(secretKey);
  if (!mode) {
    return {
      valid: false,
      mode: null,
      error: "Format de clé invalide (attendu sk_test_... ou sk_live_...)",
    };
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
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.trim().split("=");
    if (key === "t") timestamp = value;
    else if (key === "v1" && value) signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
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

  return signatures.some((sig) => timingSafeEqual(computed, sig));
}
