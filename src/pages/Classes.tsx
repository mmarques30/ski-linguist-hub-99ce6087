import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Users, Clock, Plus, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  CardGrid,
  FilterBar,
  MeterRow,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  STATE_COLORS,
} from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";

const translations = {
  title: {
    fr: "Sessions",
    "pt-BR": "Sessões",
    en: "Sessions",
  },
  subtitle: {
    fr: "Gérez les sessions de formation et l'affectation des stagiaires",
    "pt-BR": "Gerencie as sessões de treinamento e a alocação de estagiários",
    en: "Manage training sessions and student assignments",
  },
  newSession: {
    fr: "Nouvelle session",
    "pt-BR": "Nova sessão",
    en: "New Session",
  },
  allLanguages: {
    fr: "Toutes les langues",
    "pt-BR": "Todos os idiomas",
    en: "All languages",
  },
  english: {
    fr: "Anglais",
    "pt-BR": "Inglês",
    en: "English",
  },
  portuguese: {
    fr: "Portugais brésilien",
    "pt-BR": "Português brasileiro",
    en: "Brazilian Portuguese",
  },
  russian: {
    fr: "Russe",
    "pt-BR": "Russo",
    en: "Russian",
  },
  dutch: {
    fr: "Néerlandais",
    "pt-BR": "Holandês",
    en: "Dutch",
  },
  allLocations: {
    fr: "Tous les lieux",
    "pt-BR": "Todos os locais",
    en: "All locations",
  },
  noSessionsTitle: {
    fr: "Aucune session créée",
    "pt-BR": "Nenhuma sessão criada",
    en: "No sessions created",
  },
  noSessionsDesc: {
    fr: "Créez votre première session pour commencer à organiser les formations.",
    "pt-BR": "Crie sua primeira sessão para começar a organizar os treinamentos.",
    en: "Create your first session to start organizing trainings.",
  },
  level: {
    fr: "Niveau",
    "pt-BR": "Nível",
    en: "Level",
  },
  capacity: {
    fr: "Capacité",
    "pt-BR": "Capacidade",
    en: "Capacity",
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
  enrolled: {
    fr: "inscrit(s)",
    "pt-BR": "inscrito(s)",
    en: "enrolled",
  },
  viewStudents: {
    fr: "Voir stagiaires",
    "pt-BR": "Ver estagiários",
    en: "View students",
  },
  editSession: {
    fr: "Modifier session",
    "pt-BR": "Editar sessão",
    en: "Edit session",
  },
  statusUpcoming: {
    fr: "À venir",
    "pt-BR": "Próxima",
    en: "Upcoming",
  },
  statusActive: {
    fr: "En cours",
    "pt-BR": "Em andamento",
    en: "Active",
  },
  statusCompleted: {
    fr: "Terminée",
    "pt-BR": "Concluída",
    en: "Completed",
  },
};

interface ClassSession {
  id: string;
  language: string;
  level: string;
  location: string;
  startDate: string;
  endDate: string;
  time: "morning" | "afternoon";
  instructor: string;
  enrolled: number;
  capacity: number;
  status: "upcoming" | "active" | "completed";
}

const classes: ClassSession[] = [];

/** Teintes d'état — `toneForStatus` ne connaît pas ces trois codes d'écran. */
const statusTones: Record<ClassSession["status"], PillTone> = {
  upcoming: "info",
  active: "success",
  completed: "neutral",
};

const timeLabels = {
  morning: "08:00 - 12:00",
  afternoon: "14:00 - 18:00",
};

export default function Classes() {
  const { t } = useLanguage();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("classes");

  const statusLabels = {
    upcoming: t(translations.statusUpcoming),
    active: t(translations.statusActive),
    completed: t(translations.statusCompleted),
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={GraduationCap}
          tone="blue"
          actions={
            editable ? (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t(translations.newSession)}
              </Button>
            ) : undefined
          }
        />

        {/* Calendar Navigation */}
        <SurfaceCard
          title="Janvier 2026"
          actions={
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Mois précédent">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Mois suivant">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <FilterBar
            filters={
              <>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[170px]" aria-label={t(translations.allLanguages)}>
                    <SelectValue placeholder="Langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t(translations.allLanguages)}</SelectItem>
                    <SelectItem value="english">{t(translations.english)}</SelectItem>
                    <SelectItem value="portuguese">{t(translations.portuguese)}</SelectItem>
                    <SelectItem value="russian">{t(translations.russian)}</SelectItem>
                    <SelectItem value="dutch">{t(translations.dutch)}</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[170px]" aria-label={t(translations.allLocations)}>
                    <SelectValue placeholder="Lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t(translations.allLocations)}</SelectItem>
                    <SelectItem value="valdisere">Val d&apos;Isère</SelectItem>
                    <SelectItem value="courchevel">Courchevel</SelectItem>
                    <SelectItem value="meribel">Méribel</SelectItem>
                    <SelectItem value="lesarcs">Les Arcs</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />
        </SurfaceCard>

        {/* Classes Grid or Empty State */}
        {classes.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty
              icon={GraduationCap}
              title={t(translations.noSessionsTitle)}
              description={t(translations.noSessionsDesc)}
            />
          </SurfaceCard>
        ) : (
          <CardGrid cols={2}>
            {classes.map((session) => {
              const full = session.enrolled >= session.capacity;
              return (
                <SurfaceCard
                  key={session.id}
                  interactive
                  title={session.language}
                  description={`${t(translations.level)} ${session.level}`}
                  actions={
                    <StatusPill tone={statusTones[session.status]}>
                      {statusLabels[session.status]}
                    </StatusPill>
                  }
                  footer={
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        {t(translations.viewStudents)}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        {t(translations.editSession)}
                      </Button>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 truncate tabular">{session.startDate} - {session.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="tabular">{timeLabels[session.time]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 truncate">{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 shrink-0" />
                        <span className="tabular">{session.enrolled}/{session.capacity} {t(translations.enrolled)}</span>
                      </div>
                    </dl>

                    {/* Capacity Bar */}
                    <MeterRow
                      label={t(translations.capacity)}
                      value={session.enrolled}
                      max={session.capacity}
                      color={full ? STATE_COLORS.critical : "hsl(var(--chart-1))"}
                      display={
                        <span
                          className={
                            full
                              ? "text-[hsl(var(--status-critical))]"
                              : "text-[hsl(var(--status-good))]"
                          }
                        >
                          {full
                            ? t(translations.full)
                            : `${session.capacity - session.enrolled} ${t(translations.availableSpots)}`}
                        </span>
                      }
                    />
                  </div>
                </SurfaceCard>
              );
            })}
          </CardGrid>
        )}
      </PageShell>
    </MainLayout>
  );
}
