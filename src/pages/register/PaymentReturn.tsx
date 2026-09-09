import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Vérification du paiement en cours...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === "unpaid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold">Paiement non finalisé</h1>
            <p className="text-muted-foreground">
              Stripe n&apos;a pas confirmé le règlement. Votre inscription peut être enregistrée,
              mais les frais de dossier restent en attente.
            </p>
            {state.inscriptionCode && (
              <Alert>
                <AlertDescription>
                  Code d&apos;inscription : <strong>{state.inscriptionCode}</strong>
                </AlertDescription>
              </Alert>
            )}
            <Button asChild className="w-full">
              <a href="/register">Retour au formulaire</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold">Vérification impossible</h1>
            <p className="text-muted-foreground">{state.message}</p>
            {code && (
              <Alert>
                <AlertDescription>
                  Code d&apos;inscription : <strong>{code}</strong>
                </AlertDescription>
              </Alert>
            )}
            <Button asChild className="w-full">
              <a href="/register">Retour au formulaire</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Paiement confirmé</h1>
          <p className="text-muted-foreground">
            {state.amountPaid
              ? `${formatPriceEUR(state.amountPaid)} ont bien été enregistrés.`
              : "Vos frais de dossier ont bien été enregistrés."}{" "}
            Vous recevrez un email de confirmation.
          </p>
          {state.inscriptionCode && (
            <Alert>
              <AlertDescription>
                Code d&apos;inscription : <strong>{state.inscriptionCode}</strong>
              </AlertDescription>
            </Alert>
          )}
          <Alert>
            <AlertDescription className="text-sm text-muted-foreground">
              Stripe est actuellement en <strong>mode test</strong> : le paiement apparaît dans le
              dashboard Stripe test, pas sur votre relevé bancaire réel.
            </AlertDescription>
          </Alert>
          {showChequeReminder && (
            <Alert>
              <AlertDescription className="text-left space-y-2">
                <p className="font-medium">N&apos;oubliez pas d&apos;envoyer votre chèque pour le solde</p>
                <p className="text-muted-foreground text-sm">{CHEQUE_BALANCE_INSTRUCTION}</p>
              </AlertDescription>
            </Alert>
          )}
          <Button asChild className="w-full">
            <a href="/register">Retour au formulaire</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold">Paiement annulé</h1>
          <p className="text-muted-foreground">
            Votre inscription a été enregistrée, mais le paiement en ligne n&apos;a pas été finalisé.
            Notre équipe vous contactera pour régulariser la situation.
          </p>
          {code && (
            <Alert>
              <AlertDescription>
                Code d&apos;inscription : <strong>{code}</strong>
              </AlertDescription>
            </Alert>
          )}
          <Button asChild className="w-full">
            <a href="/register">Retour au formulaire</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
