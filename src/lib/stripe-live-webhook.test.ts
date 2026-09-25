import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

/**
 * Passage live Stripe : l'écran Intégrations ne doit plus se contenter
 * d'un whsec_ stocké (souvent celui du mode test). Il doit vérifier chez
 * Stripe qu'un endpoint existe pour notre URL dans le mode de la clé.
 */

describe("Stripe live webhook — vérification réelle", () => {
  it("check-stripe-config inspecte les endpoints Stripe", () => {
    const check = source("supabase/functions/check-stripe-config/index.ts");
    expect(check).toContain("inspectStripeWebhookEndpoint");
    expect(check).toContain("webhookEndpointExists");
    expect(check).toContain("webhookModeMismatch");
    expect(check).toContain("webhookOperational");
    expect(check).toMatch(/configured:[\s\S]*webhookOperational/);
  });

  it("provision enregistre le mode (test/live) avec le secret", () => {
    const provision = source("supabase/functions/provision-stripe-webhook/index.ts");
    const shared = source("supabase/functions/_shared/stripe-webhook-secret.ts");
    expect(provision).toContain("getStripeMode");
    expect(provision).toContain("saveStripeWebhookSecret(adminClient, result.secret, result.endpointId, mode)");
    expect(shared).toContain("mode");
    expect(shared).toContain("getStoredStripeWebhookSecretRecord");
  });

  it("l'UI affiche le bouton si l'endpoint live manque malgré un secret stocké", () => {
    const card = source("src/components/settings/StripeSettingsCard.tsx");
    expect(card).toContain("webhookEndpointExists === false");
    expect(card).toContain("webhookModeMismatch");
    expect(card).toContain("Webhook Stripe (endpoint)");
    expect(card).toContain("Configurer le webhook automatiquement");
  });

  it("garde le helper Deno d'inspection exporté", () => {
    const helper = source("supabase/functions/_shared/provision-stripe-webhook.ts");
    expect(helper).toContain("export async function inspectStripeWebhookEndpoint");
    expect(helper).toContain("export function findStripeWebhookForUrl");
    expect(helper).toContain("checkout.session.completed");
  });
});
