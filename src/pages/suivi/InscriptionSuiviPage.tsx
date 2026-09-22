import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  LogIn,
  MapPin,
  Languages,
  Wallet,
} from "lucide-react";
import fliLogo from "@/assets/fli-logo.png";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActivityFeed,
  DefinitionList,
  StatusPill,
  SurfaceCard,
  toneForStatus,
} from "@/components/ui-kit";
import type { FeedItem, PillTone } from "@/components/ui-kit";
import { useInscriptionSuivi } from "@/hooks/useInscriptionSuivi";
import { getStatusLabel } from "@/lib/inscription-status";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";

const PAYMENT_LABELS: Record<string, string> = {
  regle: "Réglé",
  partiel: "Partiellement réglé",
  a_regler: "À régler",
  aucun: "Aucun paiement enregistré",
};

/** Teinte de la pastille de paiement — le libellé reste celui de PAYMENT_LABELS. */
const PAYMENT_TONES: Record<string, PillTone> = {
  regle: "success",
  partiel: "warning",
  a_regler: "warning",
  aucun: "neutral",
};

function formatSchedule(schedule: string | null, rhythm: string | null): string | null {
  const parts = [schedule, rhythm].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** En-tête public commun aux états de la page (chargement, erreur, dossier). */
function SuiviHeader({ code }: { code?: string | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-[hsl(var(--surface-raised))]/95 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={fliLogo} alt="FLI" className="h-8 w-auto shrink-0" />
          <span className="truncate text-sm font-medium text-muted-foreground">
            Suivi d&apos;inscription
          </span>
        </div>
        {code && (
          <StatusPill tone="neutral" size="sm" className="font-mono tracking-wide">
            {code}
          </StatusPill>
        )}
      </div>
    </header>
  );
}

export default function InscriptionSuiviPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useInscriptionSuivi(token);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-page))]">
        <SuiviHeader />
        <main className="container mx-auto max-w-lg space-y-4 px-4 py-8" aria-busy="true">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <SurfaceCard>
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </SurfaceCard>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-page))]">
        <SuiviHeader />
        <main className="container mx-auto max-w-md px-4 py-10">
          <SurfaceCard title="Lien introuvable" icon={FileText}>
            <p className="text-sm text-muted-foreground">
              Ce lien de suivi n&apos;est pas valide ou a été renouvelé. Contactez FLI
              (info@fli.fr) avec votre code d&apos;inscription.
            </p>
          </SurfaceCard>
        </main>
      </div>
    );
  }

  const scheduleLabel = formatSchedule(data.schedule, data.rhythm);

  const detailItems = [
    ...(data.language
      ? [{ label: "Langue", value: data.language }]
      : []),
    {
      label: (
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Dates
        </span>
      ),
      value: inscriptionDateRangeLabel({
        start_date: data.start_date,
        end_date: data.end_date,
        dates_to_confirm: data.dates_to_confirm,
      }),
    },
    ...(scheduleLabel
      ? [
          {
            label: (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Horaire
              </span>
            ),
            value: scheduleLabel,
          },
        ]
      : []),
    ...(data.course_location
      ? [
          {
            label: (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Lieu
              </span>
            ),
            value: data.course_location,
          },
        ]
      : []),
  ];

  const paymentLabel = PAYMENT_LABELS[data.payment_status] ?? data.payment_status;

  const dossierItems: FeedItem[] = [
    {
      id: "documents",
      title: "Documents",
      description: data.documents_available
        ? `${data.documents_count} document${data.documents_count > 1 ? "s" : ""} disponible${
            data.documents_count > 1 ? "s" : ""
          } dans votre espace`
        : "Aucun document disponible pour le moment.",
      icon: data.documents_available ? CheckCircle2 : FileText,
      tone: data.documents_available ? "teal" : "neutral",
    },
    {
      id: "paiement",
      title: "Paiement",
      icon: Wallet,
      tone: data.payment_status === "regle" ? "teal" : "gold",
      trailing: (
        <StatusPill tone={PAYMENT_TONES[data.payment_status] ?? "neutral"} size="sm">
          {paymentLabel}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-page))]">
      <SuiviHeader code={data.code} />

      <main className="container mx-auto max-w-lg animate-fade-up space-y-4 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            Bonjour{data.first_name ? `, ${data.first_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Voici l&apos;état de votre dossier chez France Langues International.
          </p>
        </div>

        <SurfaceCard
          title="Statut"
          icon={Languages}
          actions={
            <StatusPill tone={toneForStatus(data.status)} dot>
              {getStatusLabel(data.status, "fr")}
            </StatusPill>
          }
        >
          <DefinitionList items={detailItems} columns={1} />
        </SurfaceCard>

        <SurfaceCard title="Votre dossier" icon={FileText}>
          <ActivityFeed items={dossierItems} />
        </SurfaceCard>

        <Button asChild className="h-12 w-full text-base" size="lg">
          <Link to="/auth?mode=student">
            <LogIn className="mr-2 h-4 w-4" />
            Accéder à mon espace
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Connexion par lien magique envoyé sur votre email. Besoin d&apos;aide ?
          info@fli.fr · {format(new Date(), "dd MMM yyyy", { locale: fr })}
        </p>
      </main>
    </div>
  );
}
