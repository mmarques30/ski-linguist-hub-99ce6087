import { Calendar, MapPin, Users, GraduationCap } from "lucide-react";
import { Link } from "react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSessions } from "@/hooks/useSessions";
import { StatusPill, SurfaceCard, TableEmpty } from "@/components/ui-kit";

const translations = {
  title: {
    fr: "Prochaines sessions",
    "pt-BR": "Próximas sessões",
    en: "Upcoming Sessions",
  },
  subtitle: {
    fr: "Sessions de formation à venir",
    "pt-BR": "Sessões de treinamento futuras",
    en: "Upcoming training sessions",
  },
  noSessionsTitle: {
    fr: "Aucune session planifiée",
    "pt-BR": "Nenhuma sessão planejada",
    en: "No sessions scheduled",
  },
  noSessionsDesc: {
    fr: "Les stages catalogue apparaîtront ici après synchronisation du planning",
    "pt-BR": "As sessões do catálogo aparecerão aqui após a sincronização",
    en: "Catalogue sessions will appear here after planning sync",
  },
  manageAll: {
    fr: "Gérer toutes les sessions",
    "pt-BR": "Gerenciar todas as sessões",
    en: "Manage all sessions",
  },
  level: {
    fr: "Niveau",
    "pt-BR": "Nível",
    en: "Level",
  },
  full: {
    fr: "Complet",
    "pt-BR": "Lotado",
    en: "Full",
  },
  availableSpots: {
    fr: "places disponibles",
    "pt-BR": "vagas disponíveis",
    en: "spots available",
  },
};

export function UpcomingClasses() {
  const { t } = useLanguage();
  const nowIso = new Date().toISOString();
  const { data: sessions = [], isLoading } = useSessions({
    startDate: nowIso,
  });

  const upcoming = sessions
    .filter((s) => s.status !== "annulee")
    .slice(0, 5);

  return (
    <SurfaceCard
      title={t(translations.title)}
      description={t(translations.subtitle)}
      flush
      footer={
        <Link to="/formation/sessions" className="text-sm font-medium text-primary hover:underline">
          {t(translations.manageAll)}
        </Link>
      }
    >
      {isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
      ) : upcoming.length === 0 ? (
        <TableEmpty
          icon={GraduationCap}
          title={t(translations.noSessionsTitle)}
          description={t(translations.noSessionsDesc)}
        />
      ) : (
        <ul className="divide-y divide-border">
          {upcoming.map((session) => (
            <li key={session.id} className="p-4 transition-colors hover:bg-[hsl(var(--surface-sunken))]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{session.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(translations.level)} {session.level}
                  </p>
                </div>
                <StatusPill
                  tone={session.current_students >= session.max_students ? "danger" : "success"}
                  size="sm"
                >
                  {session.current_students >= session.max_students
                    ? t(translations.full)
                    : `${session.max_students - session.current_students} ${t(translations.availableSpots)}`}
                </StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(session.start_datetime), "d MMM yyyy", { locale: fr })}
                </span>
                {session.location ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {session.location}
                  </span>
                ) : null}
                <span className="flex items-center gap-1 tabular">
                  <Users className="h-4 w-4" />
                  {session.current_students}/{session.max_students}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
}
