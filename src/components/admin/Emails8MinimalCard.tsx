import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { toast } from "sonner";
import { invokeAdminEdgeFunction } from "@/lib/admin-edge-invoke";
import {
  CONFIRMATION_BODY_FR,
  CONFIRMATION_SUBJECT_FR,
  EMAIL_FROM_DISPLAY,
  EMAIL_REPLY_TO,
  INVITE_BODY_FR,
  INVITE_SUBJECT_FR,
} from "@/lib/fli-transactional-emails";

/** Deux modèles du pack 8-minimal — jamais tous les modèles actifs. */
export const TEST_EMAIL_SLUGS = [
  "inscription_confirmation_individual",
  "student_portal_invite",
] as const;

function Preview({ title, subject, html }: { title: string; subject: string; html: string }) {
  return (
    <div className="space-y-2 rounded-[var(--radius)] border border-border p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm">
        <span className="text-muted-foreground">Sujet :</span> {subject}
      </p>
      <div
        className="prose prose-sm max-w-none rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-3 text-sm dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

type TestSendResult = {
  success?: boolean;
  sent?: boolean;
  error?: string;
  total?: number;
  ok?: number;
  failed?: number;
};

export function Emails8MinimalCard() {
  const [pending, setPending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<string | null>(null);

  const handleTestSend = async () => {
    setPending(true);
    setLastError(null);
    setLastOk(null);
    try {
      const result = await invokeAdminEdgeFunction<TestSendResult>("send-test-email", {
        slugs: [...TEST_EMAIL_SLUGS],
        to: EMAIL_REPLY_TO,
      });

      if (result && result.success === false && result.error) {
        throw new Error(result.error);
      }
      if (result && result.sent === false && result.error) {
        throw new Error(result.error);
      }

      const summary = `Deux emails de test envoyés à ${EMAIL_REPLY_TO}`;
      setLastOk(summary);
      toast.success(summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur d'envoi";
      setLastError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <SurfaceCard
      title="Emails 8-minimal"
      icon={Mail}
      description={`Expéditeur affiché : ${EMAIL_FROM_DISPLAY}. Réponse vers ${EMAIL_REPLY_TO}. Aucun cron. La clé Resend n'est pas dans le dépôt.`}
      actions={
        lastError ? (
          <StatusPill tone="danger" dot>Dernier test en échec</StatusPill>
        ) : lastOk ? (
          <StatusPill tone="success" dot>Dernier test envoyé</StatusPill>
        ) : (
          <StatusPill tone="neutral">Aucun test lancé</StatusPill>
        )
      }
    >
      <div className="space-y-4">
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

        {lastError && (
          <Alert variant="destructive">
            <AlertTitle>Échec de l&apos;envoi de test</AlertTitle>
            <AlertDescription>{lastError}</AlertDescription>
          </Alert>
        )}
        {lastOk && !lastError && (
          <Alert>
            <AlertTitle>Envoi réussi</AlertTitle>
            <AlertDescription>{lastOk}</AlertDescription>
          </Alert>
        )}

        <Button type="button" onClick={() => void handleTestSend()} disabled={pending}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Envoyer les deux tests à {EMAIL_REPLY_TO}
        </Button>
        <p className="text-xs text-muted-foreground">
          Sans clé : le bouton répond « clé absente », rien ne part. Avec la clé : deux
          messages préfixés [TEST] ({TEST_EMAIL_SLUGS.join(", ")}), corps fictif ZZTEST
          Camille. En cas d&apos;échec, le message reste affiché ci-dessus.
        </p>
      </div>
    </SurfaceCard>
  );
}
