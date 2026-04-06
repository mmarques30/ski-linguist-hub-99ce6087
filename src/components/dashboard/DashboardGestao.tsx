import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Calendar,
  Euro,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  TrendingUp,
  UserPlus,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInscriptions } from "@/hooks/useInscriptions";
import { useUpcomingTests } from "@/hooks/useUpcomingTests";
import { useDashboardStats, useRevenueProjections } from "@/hooks/useDashboardStats";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";

const translations = {
  title: {
    fr: "Dashboard de Gestão",
    "pt-BR": "Painel de Gestão",
    en: "Management Dashboard",
  },
  subtitle: {
    fr: "Visão completa das operações em tempo real",
    "pt-BR": "Visão completa das operações em tempo real",
    en: "Complete view of real-time operations",
  },
  updatedNow: {
    fr: "Atualizado agora",
    "pt-BR": "Atualizado agora",
    en: "Updated now",
  },
  newInscriptions: {
    fr: "Nouvelles Inscriptions",
    "pt-BR": "Novas Inscrições",
    en: "New Enrollments",
  },
  confirmed: {
    fr: "confirmées",
    "pt-BR": "confirmadas",
    en: "confirmed",
  },
  scheduledTests: {
    fr: "Tests Programmés",
    "pt-BR": "Testes Agendados",
    en: "Scheduled Tests",
  },
  next7Days: {
    fr: "Prochains 7 jours",
    "pt-BR": "Próximos 7 dias",
    en: "Next 7 days",
  },
  monthlyForecast: {
    fr: "Prévision Mensuelle",
    "pt-BR": "Previsão Mensal",
    en: "Monthly Forecast",
  },
  activeClasses: {
    fr: "Formations Actives",
    "pt-BR": "Turmas Ativas",
    en: "Active Classes",
  },
  confirmed_classes: {
    fr: "confirmées",
    "pt-BR": "confirmadas",
    en: "confirmed",
  },
  noActiveClasses: {
    fr: "Aucune formation en cours",
    "pt-BR": "Nenhuma turma ativa",
    en: "No active classes",
  },
  tabInscriptions: {
    fr: "Inscriptions",
    "pt-BR": "Inscrições",
    en: "Enrollments",
  },
  tabTests: {
    fr: "Tests",
    "pt-BR": "Testes",
    en: "Tests",
  },
  tabPreparation: {
    fr: "Préparation",
    "pt-BR": "Preparação",
    en: "Preparation",
  },
  tabBilling: {
    fr: "Facturation",
    "pt-BR": "Faturamento",
    en: "Billing",
  },
  recentInscriptions: {
    fr: "Inscriptions récentes",
    "pt-BR": "Inscrições recentes",
    en: "Recent enrollments",
  },
  recentInscriptionsDesc: {
    fr: "Suivi en temps réel des dernières inscriptions",
    "pt-BR": "Acompanhamento em tempo real das últimas inscrições",
    en: "Real-time tracking of latest enrollments",
  },
  testReservations: {
    fr: "Réservations de Tests",
    "pt-BR": "Reservas de Testes",
    en: "Test Reservations",
  },
  testReservationsDesc: {
    fr: "Tests de niveau et évaluations programmés",
    "pt-BR": "Testes de nível e avaliações agendadas",
    en: "Scheduled placement tests and assessments",
  },
  classPreparation: {
    fr: "Préparation des Formations",
    "pt-BR": "Preparação das Turmas",
    en: "Class Preparation",
  },
  classPreparationDesc: {
    fr: "État de validation et préparation en temps réel",
    "pt-BR": "Status de validação e preparação em tempo real",
    en: "Real-time validation and preparation status",
  },
  billingForecast: {
    fr: "Prévision de Facturation",
    "pt-BR": "Previsão de Faturamento",
    en: "Billing Forecast",
  },
  billingForecastDesc: {
    fr: "Projections et montants confirmés par mois",
    "pt-BR": "Projeções e valores confirmados por mês",
    en: "Projections and confirmed amounts by month",
  },
  statusConfirmed: {
    fr: "Confirmée",
    "pt-BR": "Confirmada",
    en: "Confirmed",
  },
  statusPending: {
    fr: "En attente",
    "pt-BR": "Pendente",
    en: "Pending",
  },
  statusInProgress: {
    fr: "En cours",
    "pt-BR": "Em andamento",
    en: "In Progress",
  },
  projected: {
    fr: "Projeté",
    "pt-BR": "Projetado",
    en: "Projected",
  },
  noData: {
    fr: "Aucune donnée disponible",
    "pt-BR": "Nenhum dado disponível",
    en: "No data available",
  },
  complete: {
    fr: "Complet",
    "pt-BR": "Completo",
    en: "Complete",
  },
  students: {
    fr: "stagiaires",
    "pt-BR": "alunos",
    en: "students",
  },
  enoughStudents: {
    fr: "Effectif suffisant",
    "pt-BR": "Alunos suficientes",
    en: "Enough students",
  },
  locationConfirmed: {
    fr: "Lieu confirmé",
    "pt-BR": "Local confirmado",
    en: "Location confirmed",
  },
  instructorConfirmed: {
    fr: "Formateur confirmé",
    "pt-BR": "Formador confirmado",
    en: "Instructor confirmed",
  },
  materialsReady: {
    fr: "Matériel prêt",
    "pt-BR": "Material pronto",
    en: "Materials ready",
  },
};

export function DashboardGestao() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("inscriptions");

  // Fetch data
  const { data: inscriptions, isLoading: loadingInscriptions } = useInscriptions();
  const { data: upcomingTests, isLoading: loadingTests } = useUpcomingTests();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: projections, isLoading: loadingProjections } = useRevenueProjections(3);

  const getDateLocale = () => {
    switch (language) {
      case "pt-BR":
        return ptBR;
      case "en":
        return enUS;
      default:
        return fr;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : "fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const recentInscriptions = inscriptions?.slice(0, 5) || [];

  // Group inscriptions by language for class preparation
  const classPreparation = inscriptions
    ?.filter((i) => i.status === "En cours")
    .reduce(
      (acc, i) => {
        const lang = i.language || "Autre";
        if (!acc[lang]) {
          acc[lang] = { count: 0, items: [] };
        }
        acc[lang].count++;
        acc[lang].items.push(i);
        return acc;
      },
      {} as Record<string, { count: number; items: typeof inscriptions }>
    ) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t(translations.title)}</CardTitle>
                <CardDescription>{t(translations.subtitle)}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--fli-teal))] animate-pulse" />
              {t(translations.updatedNow)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(translations.newInscriptions)}
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.newInscriptions.total || 0}</div>
            <p className="text-sm text-muted-foreground">
              {stats?.newInscriptions.confirmed || 0} {t(translations.confirmed)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(translations.scheduledTests)}
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--fli-blue)/0.1)]">
              <GraduationCap className="h-5 w-5 text-[hsl(var(--fli-blue))]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.upcomingTests.total || 0}</div>
            <p className="text-sm text-muted-foreground">{t(translations.next7Days)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(translations.monthlyForecast)}
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--fli-teal)/0.1)]">
              <Euro className="h-5 w-5 text-[hsl(var(--fli-teal))]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(stats?.monthlyRevenue.projected || 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(stats?.monthlyRevenue.confirmed || 0)} {t(translations.confirmed)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(translations.activeClasses)}
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--fli-purple)/0.1)]">
              <BookOpen className="h-5 w-5 text-[hsl(var(--fli-purple))]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeClasses.total || 0}</div>
            <p className="text-sm text-muted-foreground">
              {(stats?.activeClasses.total || 0) === 0
                ? t(translations.noActiveClasses)
                : `${stats?.activeClasses.validated || 0} ${t(translations.confirmed_classes)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="inscriptions" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t(translations.tabInscriptions)}</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">{t(translations.tabTests)}</span>
          </TabsTrigger>
          <TabsTrigger value="preparation" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t(translations.tabPreparation)}</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <Euro className="h-4 w-4" />
            <span className="hidden sm:inline">{t(translations.tabBilling)}</span>
          </TabsTrigger>
        </TabsList>

        {/* Inscriptions Tab */}
        <TabsContent value="inscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                {t(translations.recentInscriptions)}
              </CardTitle>
              <CardDescription>{t(translations.recentInscriptionsDesc)}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInscriptions ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                </div>
              ) : recentInscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t(translations.noData)}</div>
              ) : (
                <div className="space-y-4">
                  {recentInscriptions.map((inscription) => (
                    <div
                      key={inscription.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(inscription.student_name || "?")}
                        </div>
                        <div>
                          <p className="font-medium">{inscription.student_name}</p>
                          <p className="text-sm text-muted-foreground">{inscription.language}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-sm text-muted-foreground">
                          {inscription.start_date
                            ? format(new Date(inscription.start_date), "dd MMM yyyy", { locale: getDateLocale() })
                            : "-"}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            inscription.status === "En cours" || inscription.status === "Facturé"
                              ? "bg-accent border-primary/30 text-foreground"
                              : "bg-muted border-border text-muted-foreground"
                          }
                        >
                          {inscription.status === "En cours" || inscription.status === "Facturé"
                            ? t(translations.statusConfirmed)
                            : t(translations.statusPending)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[hsl(var(--fli-blue))]" />
                {t(translations.testReservations)}
              </CardTitle>
              <CardDescription>{t(translations.testReservationsDesc)}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTests ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                </div>
              ) : !upcomingTests || upcomingTests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t(translations.noData)}</div>
              ) : (
                <div className="space-y-4">
                  {upcomingTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--fli-blue)/0.1)]">
                          <GraduationCap className="h-5 w-5 text-[hsl(var(--fli-blue))]" />
                        </div>
                        <div>
                          <p className="font-medium">{test.candidate_name}</p>
                          <p className="text-sm text-muted-foreground">{test.test_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{test.test_date}</p>
                        <p className="text-sm text-muted-foreground">{test.test_time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preparation Tab */}
        <TabsContent value="preparation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-[hsl(var(--fli-purple))]" />
                {t(translations.classPreparation)}
              </CardTitle>
              <CardDescription>{t(translations.classPreparationDesc)}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInscriptions ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                </div>
              ) : Object.keys(classPreparation).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t(translations.noData)}</div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(classPreparation).map(([lang, data]) => {
                    // Simulated validation progress based on student count
                    const hasEnoughStudents = data.count >= 1;
                    const locationConfirmed = data.count >= 1;
                    const instructorConfirmed = data.items.some((i) => i.instructor_name);
                    const materialsReady = data.count >= 2;

                    const validations = [hasEnoughStudents, locationConfirmed, instructorConfirmed, materialsReady];
                    const progress = (validations.filter(Boolean).length / validations.length) * 100;
                    const isValidated = progress === 100;

                    return (
                      <div key={lang} className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">Formation {lang}</h4>
                              {isValidated && (
                                <Badge className="bg-[hsl(var(--fli-teal)/0.1)] border-[hsl(var(--fli-teal)/0.3)] text-[hsl(var(--fli-teal))]">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {t(translations.confirmed_classes)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline">
                                {data.count} {t(translations.students)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold">{progress.toFixed(0)}%</span>
                            <p className="text-sm text-muted-foreground">{t(translations.complete)}</p>
                          </div>
                        </div>

                        <Progress value={progress} className="h-2" />

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            {hasEnoughStudents ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--fli-teal))]" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-[hsl(var(--fli-orange))]" />
                            )}
                            {t(translations.enoughStudents)}
                          </div>
                          <div className="flex items-center gap-2">
                            {locationConfirmed ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--fli-teal))]" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-[hsl(var(--fli-orange))]" />
                            )}
                            {t(translations.locationConfirmed)}
                          </div>
                          <div className="flex items-center gap-2">
                            {instructorConfirmed ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--fli-teal))]" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-[hsl(var(--fli-orange))]" />
                            )}
                            {t(translations.instructorConfirmed)}
                          </div>
                          <div className="flex items-center gap-2">
                            {materialsReady ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--fli-teal))]" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-[hsl(var(--fli-orange))]" />
                            )}
                            {t(translations.materialsReady)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--fli-teal))]" />
                {t(translations.billingForecast)}
              </CardTitle>
              <CardDescription>{t(translations.billingForecastDesc)}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProjections ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                </div>
              ) : !projections || projections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t(translations.noData)}</div>
              ) : (
                <div className="space-y-6">
                  {projections.map((projection, index) => {
                    const percentage =
                      projection.projected > 0
                        ? (projection.confirmed / projection.projected) * 100
                        : 0;

                    return (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium capitalize">{projection.month}</h4>
                          <Badge variant="outline">{percentage.toFixed(0)}% {t(translations.confirmed)}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">{t(translations.projected)}</p>
                            <p className="text-xl font-bold">{formatCurrency(projection.projected)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t(translations.confirmed)}</p>
                            <p className="text-xl font-bold text-[hsl(var(--fli-teal))]">
                              {formatCurrency(projection.confirmed)}
                            </p>
                          </div>
                        </div>

                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
