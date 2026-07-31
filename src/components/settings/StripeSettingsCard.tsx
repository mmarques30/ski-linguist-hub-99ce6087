import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useStripeConfig } from "@/hooks/useStripeConfig";

const LOVABLE_EDITOR_URL = "https://lovable.dev/projects/34e71e1a-49f7-433e-bb36-fc4d26e86f8e";
const STRIPE_DASHBOARD_URL = "https://dashboard.stripe.com/test/apikeys";
const STRIPE_WEBHOOKS_URL = "https://dashboard.stripe.com/test/webhooks";

interface StripeSettingsCardProps {
  configureLabel: string;
}

export function StripeSettingsCard({ configureLabel }: StripeSettingsCardProps) {
  const { data, isLoading, isError, refetch } = useStripeConfig();
  const [isCopying, setIsCopying] = useState(false);

  const isFullyConfigured = Boolean(
    data?.secretKeyConfigured && data?.webhookSecretConfigured
  );

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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Stripe
              {isLoading ? (
                <Badge variant="secondary">Vérification...</Badge>
              ) : isFullyConfigured ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">Configuré</Badge>
              ) : (
                <Badge variant="destructive">À configurer</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Paiements en ligne pour les inscriptions (/register) — frais de dossier et paiement intégral.
            </CardDescription>
          </div>
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
            <span className="font-bold text-primary">S</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Impossible de vérifier Stripe</AlertTitle>
            <AlertDescription>
              Déployez la fonction <code>check-stripe-config</code> puis réessayez.
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusRow
              label="STRIPE_SECRET_KEY"
              ok={data.secretKeyConfigured}
            />
            <StatusRow
              label="STRIPE_WEBHOOK_SECRET"
              ok={data.webhookSecretConfigured}
            />
          </div>
        )}

        <Alert>
          <AlertTitle>Étapes de configuration</AlertTitle>
          <AlertDescription className="space-y-3 text-sm">
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Ouvrez{" "}
                <a
                  href={STRIPE_DASHBOARD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium"
                >
                  Stripe → API Keys (mode test)
                </a>{" "}
                et copiez la <strong>Secret key</strong> (<code>sk_test_...</code>).
              </li>
              <li>
                Dans{" "}
                <a
                  href={LOVABLE_EDITOR_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium"
                >
                  Lovable → Cloud → Secrets
                </a>
                , ajoutez <code>STRIPE_SECRET_KEY</code>.
              </li>
              <li>
                Créez un webhook dans{" "}
                <a
                  href={STRIPE_WEBHOOKS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium"
                >
                  Stripe → Webhooks
                </a>{" "}
                avec l&apos;URL ci-dessous et l&apos;événement{" "}
                <code>checkout.session.completed</code>.
              </li>
              <li>
                Ajoutez le signing secret dans Lovable Cloud Secrets sous{" "}
                <code>STRIPE_WEBHOOK_SECRET</code> (<code>whsec_...</code>).
              </li>
              <li>
                Déployez l&apos;application, puis testez une inscription avec la carte{" "}
                <code>4242 4242 4242 4242</code>.
              </li>
            </ol>
          </AlertDescription>
        </Alert>

        {data?.webhookUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">URL du webhook Stripe</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-xs break-all">
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
            <a href={LOVABLE_EDITOR_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {configureLabel}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={STRIPE_DASHBOARD_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Stripe Dashboard
            </a>
          </Button>
          <Button type="button" variant="ghost" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Vérifier à nouveau
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
      <code>{label}</code>
      {ok ? (
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          OK
        </span>
      ) : (
        <span className="flex items-center gap-1 text-destructive">
          <XCircle className="h-4 w-4" />
          Manquant
        </span>
      )}
    </div>
  );
}
