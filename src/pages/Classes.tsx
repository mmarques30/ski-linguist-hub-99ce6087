import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Users, Clock, Plus, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";

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
    fr: "Portugais",
    "pt-BR": "Português",
    en: "Portuguese",
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

const statusStyles = {
  upcoming: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-800",
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">
              {t(translations.subtitle)}
            </p>
          </div>
          {editable && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t(translations.newSession)}
            </Button>
          )}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Janvier 2026</h2>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Lieu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t(translations.allLocations)}</SelectItem>
                <SelectItem value="valdisere">Val d'Isère</SelectItem>
                <SelectItem value="courchevel">Courchevel</SelectItem>
                <SelectItem value="meribel">Méribel</SelectItem>
                <SelectItem value="lesarcs">Les Arcs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Classes Grid or Empty State */}
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
            <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t(translations.noSessionsTitle)}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              {t(translations.noSessionsDesc)}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{session.language}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {t(translations.level)} {session.level}
                      </p>
                    </div>
                    <Badge className={cn(statusStyles[session.status])}>
                      {statusLabels[session.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{session.startDate} - {session.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{timeLabels[session.time]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{session.enrolled}/{session.capacity} {t(translations.enrolled)}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t(translations.capacity)}</span>
                      <span className={cn(
                        "font-medium",
                        session.enrolled >= session.capacity ? "text-red-600" : "text-emerald-600"
                      )}>
                        {session.enrolled >= session.capacity 
                          ? t(translations.full) 
                          : `${session.capacity - session.enrolled} ${t(translations.availableSpots)}`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          session.enrolled >= session.capacity 
                            ? "bg-red-500" 
                            : "bg-primary"
                        )}
                        style={{ width: `${(session.enrolled / session.capacity) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      {t(translations.viewStudents)}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      {t(translations.editSession)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
