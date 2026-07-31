import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Paiement confirmé</h1>
          <p className="text-muted-foreground">
            Votre paiement a bien été enregistré. Vous recevrez un email de confirmation.
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
