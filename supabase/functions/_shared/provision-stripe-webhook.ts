const WEBHOOK_EVENT = "checkout.session.completed";

export interface StripeWebhookEndpoint {
  id: string;
  url: string;
  status?: string;
}

async function stripeRequest<T>(
  stripeSecretKey: string,
  path: string,
  method: "GET" | "POST" = "GET",
  body?: URLSearchParams
): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" ? body : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Stripe API error (${response.status})`);
  }

  return data as T;
}

export async function listStripeWebhookEndpoints(
  stripeSecretKey: string
): Promise<StripeWebhookEndpoint[]> {
  const data = await stripeRequest<{ data: StripeWebhookEndpoint[] }>(
    stripeSecretKey,
    "/webhook_endpoints?limit=100"
  );
  return data.data || [];
}

export async function createStripeWebhookEndpoint(
  stripeSecretKey: string,
  webhookUrl: string
): Promise<{ id: string; secret: string }> {
  const body = new URLSearchParams({
    url: webhookUrl,
    "enabled_events[0]": WEBHOOK_EVENT,
    description: "FLI Ski Linguist Hub — inscriptions /register",
  });

  const data = await stripeRequest<{ id: string; secret: string }>(
    stripeSecretKey,
    "/webhook_endpoints",
    "POST",
    body
  );

  if (!data.secret) {
    throw new Error("Stripe n'a pas retourné le signing secret du webhook");
  }

  return { id: data.id, secret: data.secret };
}

export async function rollStripeWebhookSecret(
  stripeSecretKey: string,
  endpointId: string
): Promise<string> {
  const data = await stripeRequest<{ secret: string }>(
    stripeSecretKey,
    `/webhook_endpoints/${encodeURIComponent(endpointId)}/secret`,
    "POST",
    new URLSearchParams()
  );

  if (!data.secret) {
    throw new Error("Impossible de régénérer le signing secret Stripe");
  }

  return data.secret;
}

export async function ensureStripeWebhookEndpoint(
  stripeSecretKey: string,
  webhookUrl: string
): Promise<{ endpointId: string; secret: string; created: boolean }> {
  const existing = (await listStripeWebhookEndpoints(stripeSecretKey)).find(
    (endpoint) => endpoint.url === webhookUrl
  );

  if (existing) {
    const secret = await rollStripeWebhookSecret(stripeSecretKey, existing.id);
    return { endpointId: existing.id, secret, created: false };
  }

  const created = await createStripeWebhookEndpoint(stripeSecretKey, webhookUrl);
  return { endpointId: created.id, secret: created.secret, created: true };
}
