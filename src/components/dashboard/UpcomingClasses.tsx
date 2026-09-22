import { Calendar, MapPin, Users, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
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
    fr: "Les sessions apparaîtront ici",
    "pt-BR": "As sessões aparecerão aqui",
    en: "Sessions will appear here",
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

interface ClassSession {
  id: string;
  language: string;
  level: string;
  location: string;
  date: string;
  time: string;
  enrolled: number;
  capacity: number;
}

const classes: ClassSession[] = [];

export function UpcomingClasses() {
  const { t } = useLanguage();

  return (
    <SurfaceCard
      title={t(translations.title)}
      description={t(translations.subtitle)}
      flush
      footer={
        // Le bouton n'avait aucune destination : il mène désormais au planning.
        <Link to="/formation/sessions" className="text-sm font-medium text-primary hover:underline">
          {t(translations.manageAll)}
        </Link>
      }
    >
      {classes.length === 0 ? (
        <TableEmpty
          icon={GraduationCap}
          title={t(translations.noSessionsTitle)}
          description={t(translations.noSessionsDesc)}
        />
      ) : (
        <ul className="divide-y divide-border">
          {classes.map((session) => (
            <li key={session.id} className="p-4 transition-colors hover:bg-[hsl(var(--surface-sunken))]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{session.language}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(translations.level)} {session.level}
                  </p>
                </div>
                <StatusPill
                  tone={session.enrolled >= session.capacity ? "danger" : "success"}
                  size="sm"
                >
                  {session.enrolled >= session.capacity
                    ? t(translations.full)
                    : `${session.capacity - session.enrolled} ${t(translations.availableSpots)}`}
                </StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {session.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </span>
                <span className="flex items-center gap-1 tabular">
                  <Users className="h-4 w-4" />
                  {session.enrolled}/{session.capacity}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
}
