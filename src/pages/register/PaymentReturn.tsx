import { ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { IconChip, StatusPill, SurfaceCard } from "@/components/ui-kit";
import type { TileTone } from "@/components/ui-kit";
import { verifyRegistrationCheckout } from "@/services/registrationService";
import {
  CHEQUE_BALANCE_INSTRUCTION,
  hasChequeBalance,
  type RegistrationPaymentOption,
} from "@/lib/registration-payments";
import { formatPriceEUR } from "@/lib/registration-offerings";

type PaymentSuccessState =
  | { status: "loading" }
  | { status: "paid"; inscriptionCode?: string | null; amountPaid?: number }
  | { status: "unpaid"; inscriptionCode?: string | null }
  | { status: "error"; message: string };

/**
 * Coque commune des retours Stripe : une seule carte centrée, lisible sur un
 * téléphone, avec l'issue (réussite / échec) affichée sans ambiguïté.
 */
function ReturnShell({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: TileTone;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-page))] p-4 sm:p-6">
      <SurfaceCard
        className="w-full max-w-lg animate-fade-up"
        accent={tone === "teal" ? "chart-3" : "primary"}
        bodyClassName="p-5 sm:p-6"
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <IconChip icon={Icon} tone={tone} size="lg" />
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {title}
            </h1>
            {description && (
              <div className="max-w-md text-sm text-muted-foreground">{description}</div>
            )}
          </div>
          {children}
        </div>
      </SurfaceCard>
    </div>
  );
}

/** Rappel du code d'inscription, mis en évidence pour être lu au téléphone. */
function InscriptionCode({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] bg-[hsl(var(--surface-sunken))] p-4 text-center">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Code d&apos;inscription
      </span>
      <StatusPill tone="warning" className="px-4 py-1.5 text-base">
        {code}
      </StatusPill>
    </div>
  );
}

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const sessionId = searchParams.get("session_id");
  const paymentOption = searchParams.get("option");
  const showChequeReminder =
    paymentOption && hasChequeBalance(paymentOption as RegistrationPaymentOption);
  const [state, setState] = useState<PaymentSuccessState>({ status: "loading" });

  useEffect(() => {
    if (!sessionId) {
      setState({
        status: "error",
        message:
          "Session de paiement introuvable. Si vous avez payé, contactez FLI avec votre code d'inscription.",
      });
      return;
    }

    let cancelled = false;

    verifyRegistrationCheckout(sessionId)
      .then((result) => {
        if (cancelled) return;
        if (result.paymentStatus === "paid") {
          setState({
            status: "paid",
            inscriptionCode: result.inscriptionCode ?? code,
            amountPaid: result.amountPaid,
          });
          return;
        }
        setState({
          status: "unpaid",
          inscriptionCode: result.inscriptionCode ?? code,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de vérifier le paiement auprès de Stripe.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, code]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-page))] p-4">
        <SurfaceCard className="w-full max-w-lg" bodyClassName="p-6">
          <div className="flex flex-col items-center gap-4 text-center" aria-live="polite">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Vérification du paiement en cours...</p>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  if (state.status === "unpaid") {
    return (
      <ReturnShell
        icon={XCircle}
        tone="gold"
        title="Paiement non finalisé"
        description="Stripe n'a pas confirmé le règlement. Votre inscription peut être enregistrée, mais les frais de dossier restent en attente."
      >
        {state.inscriptionCode && <InscriptionCode code={state.inscriptionCode} />}
        <Button asChild className="h-12 w-full text-base">
          <a href="/register">Retour au formulaire</a>
        </Button>
      </ReturnShell>
    );
  }

  if (state.status === "error") {
    return (
      <ReturnShell
        icon={XCircle}
        tone="gold"
        title="Vérification impossible"
        description={state.message}
      >
        {code && <InscriptionCode code={code} />}
        <Button asChild className="h-12 w-full text-base">
          <a href="/register">Retour au formulaire</a>
        </Button>
      </ReturnShell>
    );
  }

  return (
    <ReturnShell
      icon={CheckCircle}
      tone="teal"
      title="Paiement confirmé"
      description={
        <>
          {state.amountPaid
            ? `${formatPriceEUR(state.amountPaid)} ont bien été enregistrés.`
            : "Vos frais de dossier ont bien été enregistrés."}{" "}
          Vous recevrez un email de confirmation.
        </>
      }
    >
      {state.inscriptionCode && <InscriptionCode code={state.inscriptionCode} />}
      <Alert>
        <AlertDescription className="text-sm text-muted-foreground">
          Stripe est actuellement en <strong>mode test</strong> : le paiement apparaît dans le
          dashboard Stripe test, pas sur votre relevé bancaire réel.
        </AlertDescription>
      </Alert>
      {showChequeReminder && (
        <Alert>
          <AlertDescription className="space-y-2 text-left">
            <p className="font-medium">N&apos;oubliez pas d&apos;envoyer votre chèque pour le solde</p>
            <p className="text-sm text-muted-foreground">{CHEQUE_BALANCE_INSTRUCTION}</p>
          </AlertDescription>
        </Alert>
      )}
      <Button asChild className="h-12 w-full text-base">
        <a href="/register">Retour au formulaire</a>
      </Button>
    </ReturnShell>
  );
}

export function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  return (
    <ReturnShell
      icon={XCircle}
      tone="gold"
      title="Paiement annulé"
      description="Votre inscription a été enregistrée, mais le paiement en ligne n'a pas été finalisé. Notre équipe vous contactera pour régulariser la situation."
    >
      {code && <InscriptionCode code={code} />}
      <Button asChild className="h-12 w-full text-base">
        <a href="/register">Retour au formulaire</a>
      </Button>
    </ReturnShell>
  );
}
