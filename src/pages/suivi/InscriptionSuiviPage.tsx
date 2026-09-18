import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  LogIn,
  MapPin,
  Wallet,
} from "lucide-react";
import fliLogo from "@/assets/fli-logo.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInscriptionSuivi } from "@/hooks/useInscriptionSuivi";
import { getStatusLabel, getStatusStyle } from "@/lib/inscription-status";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";

const PAYMENT_LABELS: Record<string, string> = {
  regle: "Réglé",
  partiel: "Partiellement réglé",
  a_regler: "À régler",
  aucun: "Aucun paiement enregistré",
};

function formatSchedule(schedule: string | null, rhythm: string | null): string | null {
  const parts = [schedule, rhythm].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export default function InscriptionSuiviPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useInscriptionSuivi(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 px-4">
        <img src={fliLogo} alt="FLI" className="h-10 w-auto" />
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Lien introuvable</CardTitle>
            <CardDescription>
              Ce lien de suivi n&apos;est pas valide ou a été renouvelé. Contactez
              FLI (info@fli.fr) avec votre code d&apos;inscription.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const scheduleLabel = formatSchedule(data.schedule, data.rhythm);
  const statusStyle = getStatusStyle(data.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={fliLogo} alt="FLI" className="h-8 w-auto" />
            <span className="text-sm font-medium text-muted-foreground">
              Suivi d&apos;inscription
            </span>
          </div>
          {data.code && (
            <Badge variant="outline" className="font-mono tracking-wide">
              {data.code}
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour{data.first_name ? `, ${data.first_name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Voici l&apos;état de votre dossier chez France Langues International.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Statut</CardTitle>
              <Badge className={statusStyle}>{getStatusLabel(data.status, "fr")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.language && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Langue</span>
                <span className="font-medium text-right">{data.language}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 items-start">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Dates
              </span>
              <span className="font-medium text-right">
                {inscriptionDateRangeLabel({
                  start_date: data.start_date,
                  end_date: data.end_date,
                  dates_to_confirm: data.dates_to_confirm,
                })}
              </span>
            </div>
            {scheduleLabel && (
              <div className="flex justify-between gap-4 items-start">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Horaire
                </span>
                <span className="font-medium text-right">{scheduleLabel}</span>
              </div>
            )}
            {data.course_location && (
              <div className="flex justify-between gap-4 items-start">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Lieu
                </span>
                <span className="font-medium text-right">{data.course_location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.documents_available ? (
              <p className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                {data.documents_count} document
                {data.documents_count > 1 ? "s" : ""} disponible
                {data.documents_count > 1 ? "s" : ""} dans votre espace
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun document disponible pour le moment.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {PAYMENT_LABELS[data.payment_status] ?? data.payment_status}
            </Badge>
          </CardContent>
        </Card>

        <Button asChild className="w-full" size="lg">
          <Link to="/auth?mode=student">
            <LogIn className="mr-2 h-4 w-4" />
            Accéder à mon espace
          </Link>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Connexion par lien magique envoyé sur votre email. Besoin d&apos;aide ?
          info@fli.fr ·{" "}
          {format(new Date(), "dd MMM yyyy", { locale: fr })}
        </p>
      </main>
    </div>
  );
}
