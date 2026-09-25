import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Copy, CreditCard, ExternalLink, Loader2, XCircle } from "lucide-react";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { toast } from "sonner";
import { useProvisionStripeWebhook, useStripeConfig } from "@/hooks/useStripeConfig";

const SUPABASE_PROJECT_URL =
  "https://supabase.com/dashboard/project/nghkrmvakjomzmfwdhbo/settings/functions";
const GITHUB_REPO_URL = "https://github.com/mmarques30/ski-linguist-hub-99ce6087";
const STRIPE_TEST_KEYS_URL = "https://dashboard.stripe.com/test/apikeys";
const STRIPE_LIVE_KEYS_URL = "https://dashboard.stripe.com/apikeys";
const STRIPE_TEST_WEBHOOKS_URL = "https://dashboard.stripe.com/test/webhooks";
const STRIPE_LIVE_WEBHOOKS_URL = "https://dashboard.stripe.com/webhooks";

interface StripeSettingsCardProps {
  configureLabel: string;
}

export function StripeSettingsCard({ configureLabel }: StripeSettingsCardProps) {
  const { data, isLoading, isError, refetch } = useStripeConfig();
  const provisionWebhook = useProvisionStripeWebhook();
  const [isCopying, setIsCopying] = useState(false);

  const isFullyConfigured = Boolean(data?.configured);
  const webhookEndpointMissing = Boolean(
    data?.secretKeyConfigured &&
      data?.secretKeyValid &&
      data?.webhookEndpointExists === false
  );
  const webhookSecretStale = Boolean(
    data?.secretKeyConfigured &&
      data?.secretKeyValid &&
      data?.webhookSecretConfigured &&
      (data.webhookModeMismatch || data.webhookEndpointExists === false)
  );
  const webhookMissing = Boolean(
    data?.secretKeyConfigured &&
      data?.secretKeyValid &&
      (!data.webhookSecretConfigured ||
        data.webhookEndpointExists === false ||
        data.webhookModeMismatch ||
        data.webhookHasRequiredEvents === false ||
        data.webhookEndpointError)
  );
  const isTestMode = data?.mode !== "live";
  const keysUrl = isTestMode ? STRIPE_TEST_KEYS_URL : STRIPE_LIVE_KEYS_URL;
  const webhooksUrl = isTestMode ? STRIPE_TEST_WEBHOOKS_URL : STRIPE_LIVE_WEBHOOKS_URL;

  const copyText = async (text: string, label: string) => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error("Impossible de copier");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <SurfaceCard
      title="Stripe"
      icon={CreditCard}
      description="Paiements en ligne pour les inscriptions (/register) — frais de dossier (150 €) et paiement intégral."
      actions={
        <>
          {isLoading ? (
            <StatusPill tone="neutral">Vérification...</StatusPill>
          ) : isFullyConfigured ? (
            <StatusPill tone="success" dot>Opérationnel</StatusPill>
          ) : webhookMissing ? (
            <StatusPill tone="danger" dot>Webhook manquant</StatusPill>
          ) : (
            <StatusPill tone="danger" dot>À configurer</StatusPill>
          )}
          {data?.mode && (
            <StatusPill tone={data.mode === "live" ? "accent" : "neutral"}>
              {data.mode === "live" ? "Mode live" : "Mode test"}
            </StatusPill>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Impossible de vérifier Stripe</AlertTitle>
            <AlertDescription>
              Déployez la fonction <code>check-stripe-config</code> depuis GitHub puis réessayez.
            </AlertDescription>
          </Alert>
        )}

        {webhookMissing && (
          <Alert variant="destructive">
            <AlertTitle>
              {webhookEndpointMissing || webhookSecretStale
                ? `Webhook ${data?.mode === "live" ? "live" : "test"} manquant`
                : "Webhook manquant"}
            </AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Les paiements Stripe ne sont pas enregistrés dans FLI tant que le webhook n&apos;est pas
                configuré (<code>checkout.session.completed</code>) dans le mode de la clé actuelle
                {data?.mode ? ` (${data.mode})` : ""}.
              </p>
              {data?.webhookEndpointError && (
                <p className="text-sm">Erreur Stripe : {data.webhookEndpointError}</p>
              )}
              {data?.webhookModeMismatch && (
                <p className="text-sm">
                  Un secret webhook est stocké pour le mode{" "}
                  <strong>{data.storedWebhookMode}</strong>, alors que la clé est en mode{" "}
                  <strong>{data.mode}</strong>. Recréez le webhook pour ce mode.
                </p>
              )}
              {data?.webhookSecretConfigured && data.webhookEndpointExists === false && (
                <p className="text-sm">
                  Un signing secret est encore en base, mais aucun endpoint n&apos;existe chez Stripe
                  pour{" "}
                  <code className="break-all">{data.webhookUrl}</code> en mode{" "}
                  <strong>{data.mode}</strong> (endpoints listés : {data.webhookEndpointCount ?? 0}).
                </p>
              )}
              <Button
                type="button"
                variant="secondary"
                disabled={provisionWebhook.isPending || !data?.secretKeyValid}
                onClick={() =>
                  provisionWebhook.mutate(undefined, {
                    onSuccess: (result) => toast.success(result.message),
                    onError: (error) =>
                      toast.error(
                        error instanceof Error ? error.message : "Configuration webhook échouée"
                      ),
                  })
                }
              >
                {provisionWebhook.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Configurer le webhook automatiquement
              </Button>
              <p className="text-xs text-muted-foreground">
                Crée le endpoint Stripe ({data?.mode ?? "test/live"}) et enregistre le secret. Déployez
                d&apos;abord la fonction <code>provision-stripe-webhook</code> si le bouton échoue.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {data?.webhookSecretConfigured &&
          data.webhookSecretFromSettings &&
          data.webhookEndpointExists &&
          !data.webhookModeMismatch && (
          <Alert>
            <AlertTitle>Webhook configuré via l&apos;application</AlertTitle>
            <AlertDescription>
              Endpoint <code>{data.webhookEndpointId}</code> ({data.mode}) — signing secret stocké de
              façon sécurisée. Vous pouvez aussi le copier dans Supabase Secrets (
              <code>STRIPE_WEBHOOK_SECRET</code>) pour une config classique.
            </AlertDescription>
          </Alert>
        )}

        {data?.secretKeyConfigured && !data.secretKeyValid && (
          <Alert variant="destructive">
            <AlertTitle>Clé Stripe invalide</AlertTitle>
            <AlertDescription>
              {data.secretKeyError || "Stripe a refusé la clé secrète configurée."}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusRow
              label="STRIPE_SECRET_KEY"
              ok={data.secretKeyConfigured && data.secretKeyValid}
            />
            <StatusRow
              label="Webhook Stripe (endpoint)"
              ok={Boolean(
                data.webhookEndpointExists &&
                  data.webhookHasRequiredEvents &&
                  !data.webhookModeMismatch &&
                  !data.webhookEndpointError
              )}
            />
            <StatusRow label="STRIPE_WEBHOOK_SECRET" ok={data.webhookSecretConfigured} />
          </div>
        )}

        {isFullyConfigured ? (
          <Alert>
            <AlertTitle>
              {data?.mode === "live" ? "Prêt pour les paiements réels" : "Prêt pour les tests"}
            </AlertTitle>
            <AlertDescription className="space-y-2 text-sm">
              {data?.mode === "live" ? (
                <p>
                  Mode <strong>live</strong> : les paiements sur <code>/register</code> débitent de
                  vraies cartes. Vérifiez aussi{" "}
                  <a href={STRIPE_LIVE_WEBHOOKS_URL} target="_blank" rel="noreferrer" className="underline">
                    Stripe → Webhooks (live)
                  </a>
                  .
                </p>
              ) : (
                <>
                  <p>
                    Mode <strong>test</strong> : sur <code>/register</code>, choisir un paiement Stripe
                    (150 € ou intégral), puis carte <code>4242 4242 4242 4242</code>.
                  </p>
                  <p className="text-muted-foreground">
                    Le montant s&apos;affiche en euros. Après paiement, une ligne apparaît dans{" "}
                    <code>payments</code> (méthode Stripe) et le webhook met à jour l&apos;inscription.
                  </p>
                </>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTitle>Étapes de configuration (GitHub + Supabase)</AlertTitle>
            <AlertDescription className="space-y-3 text-sm">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Ouvrez{" "}
                  <a href={keysUrl} target="_blank" rel="noreferrer" className="underline font-medium">
                    Stripe → API Keys
                  </a>{" "}
                  et copiez la <strong>Secret key</strong>.
                </li>
                <li>
                  Dans{" "}
                  <a href={SUPABASE_PROJECT_URL} target="_blank" rel="noreferrer" className="underline font-medium">
                    Supabase → Edge Functions → Secrets
                  </a>
                  , ajoutez <code>STRIPE_SECRET_KEY</code>.
                </li>
                <li>
                  Créez un webhook dans{" "}
                  <a href={webhooksUrl} target="_blank" rel="noreferrer" className="underline font-medium">
                    Stripe → Webhooks
                  </a>{" "}
                  avec l&apos;URL ci-dessous et <code>checkout.session.completed</code>.
                </li>
                <li>
                  Ajoutez <code>STRIPE_WEBHOOK_SECRET</code> (<code>whsec_...</code>) dans Supabase Secrets.
                </li>
                <li>
                  Cliquez sur <strong>Configurer le webhook automatiquement</strong> ci-dessus, ou exécutez{" "}
                  <code>scripts/setup-stripe-webhook.sh</code> avec <code>STRIPE_SECRET_KEY</code>.
                </li>
                <li>
                  Déployez depuis le repo :{" "}
                  <code>supabase functions deploy stripe-webhook provision-stripe-webhook verify-registration-checkout</code>
                </li>
                <li>
                  Testez avec la carte <code>4242 4242 4242 4242</code>.
                </li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {data?.webhookUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">URL du webhook Stripe</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 break-all rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] px-3 py-2 text-xs">
                {data.webhookUrl}
              </code>
              <Button
                type="button"
                variant="outline"
                disabled={isCopying}
                onClick={() => copyText(data.webhookUrl!, "URL webhook")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copier
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={SUPABASE_PROJECT_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {configureLabel}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={keysUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Stripe Dashboard
            </a>
          </Button>
          <Button type="button" variant="ghost" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Vérifier à nouveau
          </Button>
        </div>
      </div>
    </SurfaceCard>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] px-3 py-2 text-sm">
      <code className="min-w-0 truncate">{label}</code>
      <StatusPill tone={ok ? "success" : "danger"} icon={ok ? CheckCircle2 : XCircle} size="sm">
        {ok ? "OK" : "Manquant"}
      </StatusPill>
    </div>
  );
}
