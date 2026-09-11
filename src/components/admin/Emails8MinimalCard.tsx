import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CONFIRMATION_BODY_FR,
  CONFIRMATION_SUBJECT_FR,
  EMAIL_FROM_DISPLAY,
  EMAIL_REPLY_TO,
  INVITE_BODY_FR,
  INVITE_SUBJECT_FR,
} from "@/lib/fli-transactional-emails";

function Preview({ title, subject, html }: { title: string; subject: string; html: string }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm">
        <span className="text-muted-foreground">Sujet :</span> {subject}
      </p>
      <div
        className="prose prose-sm max-w-none rounded bg-muted/40 p-3 text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export function Emails8MinimalCard() {
  const [pending, setPending] = useState(false);

  const handleTestSend = async () => {
    setPending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Non authentifié");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (response.status === 409) {
        toast.message(result.error || "Clé Resend absente — aucun email n'est parti.");
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Échec de l'envoi de test");
      }
      toast.success(`Deux emails de test envoyés à ${EMAIL_REPLY_TO}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur d'envoi");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Emails 8-minimal
        </CardTitle>
        <CardDescription>
          Expéditeur affiché : {EMAIL_FROM_DISPLAY}. Réponse vers {EMAIL_REPLY_TO}.
          Aucun cron. La clé Resend n'est pas dans le dépôt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Textes avant activation</AlertTitle>
          <AlertDescription>
            Les deux modèles ci-dessous partent tels quels. Variables : student_name,
            language, start_date, end_date, inscription_code, magic_link.
          </AlertDescription>
        </Alert>
        <Preview
          title="1. Confirmation d'inscription (déclenchée par /register)"
          subject={CONFIRMATION_SUBJECT_FR}
          html={CONFIRMATION_BODY_FR}
        />
        <Preview
          title="2. Invitation à l'espace stagiaire (lien magique)"
          subject={INVITE_SUBJECT_FR}
          html={INVITE_BODY_FR}
        />
        <Button onClick={() => void handleTestSend()} disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Envoyer les deux tests à {EMAIL_REPLY_TO}
        </Button>
        <p className="text-xs text-muted-foreground">
          Sans clé : le bouton répond « clé absente », rien ne part. Avec la clé : deux
          messages préfixés [TEST], corps fictif ZZTEST Camille.
        </p>
      </CardContent>
    </Card>
  );
}
