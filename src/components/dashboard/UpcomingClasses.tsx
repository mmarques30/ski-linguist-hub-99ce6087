import { Calendar, MapPin, Users, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h3 className="font-semibold">{t(translations.title)}</h3>
        <p className="text-sm text-muted-foreground">{t(translations.subtitle)}</p>
      </div>
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">{t(translations.noSessionsTitle)}</p>
          <p className="text-sm text-muted-foreground">
            {t(translations.noSessionsDesc)}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {classes.map((session) => (
            <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{session.language}</p>
                  <p className="text-sm text-muted-foreground">{t(translations.level)} {session.level}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  session.enrolled >= session.capacity 
                    ? "bg-red-100 text-red-700" 
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {session.enrolled >= session.capacity 
                    ? t(translations.full) 
                    : `${session.capacity - session.enrolled} ${t(translations.availableSpots)}`}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {session.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {session.enrolled}/{session.capacity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t p-4">
        <button className="text-sm font-medium text-primary hover:underline">
          {t(translations.manageAll)}
        </button>
      </div>
    </div>
  );
}
