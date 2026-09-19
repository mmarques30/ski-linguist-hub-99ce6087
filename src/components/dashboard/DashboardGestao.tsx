import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Euro,
  Clock,
  BookOpen,
  TrendingUp,
  UserPlus,
  GraduationCap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInscriptions } from "@/hooks/useInscriptions";
import { useUpcomingTests } from "@/hooks/useUpcomingTests";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { DashboardActionRail } from "@/components/dashboard/DashboardActionRail";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";

const translations = {
  title: {
    fr: "Tableau de bord",
    "pt-BR": "Painel de Gestão",
    en: "Management Dashboard",
  },
  subtitle: {
    fr: "Vue complète de l'activité en temps réel",
    "pt-BR": "Visão completa das operações em tempo real",
    en: "Complete view of real-time operations",
  },
  updatedNow: {
    fr: "Actualisé à l'instant",
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
    fr: "CA facturé du mois",
    "pt-BR": "Faturado no mês",
    en: "Billed this month",
  },
  seeAll: {
    fr: "Voir tout",
    "pt-BR": "Ver tudo",
    en: "See all",
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
  noData: {
    fr: "Aucune donnée disponible",
    "pt-BR": "Nenhum dado disponível",
    en: "No data available",
  },
};

export function DashboardGestao() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("inscriptions");

  // Fetch data
  const { data: inscriptions, isLoading: loadingInscriptions } = useInscriptions();
  const { data: upcomingTests, isLoading: loadingTests } = useUpcomingTests();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();

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

      {/* KPI Cards — cliquables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/inscriptions" className="block transition-opacity hover:opacity-90">
          <Card className="h-full cursor-pointer hover:border-primary/40">
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
        </Link>

        <button
          type="button"
          className="text-left block w-full transition-opacity hover:opacity-90"
          onClick={() => setActiveTab("tests")}
        >
          <Card className="h-full cursor-pointer hover:border-primary/40">
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
        </button>

        <Link to="/invoices" className="block transition-opacity hover:opacity-90">
          <Card className="h-full cursor-pointer hover:border-primary/40">
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
        </Link>

        <Link
          to="/inscriptions?status=en_cours"
          className="block transition-opacity hover:opacity-90"
        >
          <Card className="h-full cursor-pointer hover:border-primary/40">
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
        </Link>
      </div>

      <DashboardActionRail />

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="inscriptions" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t(translations.tabInscriptions)}</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">{t(translations.tabTests)}</span>
          </TabsTrigger>
        </TabsList>

        {/* Inscriptions Tab */}
        <TabsContent value="inscriptions">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  {t(translations.recentInscriptions)}
                </CardTitle>
                <CardDescription>{t(translations.recentInscriptionsDesc)}</CardDescription>
              </div>
              <Link
                to="/inscriptions"
                className="text-sm text-primary hover:underline shrink-0"
              >
                {t(translations.seeAll)}
              </Link>
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
                    <Link
                      key={inscription.id}
                      to={`/inscriptions/${inscription.id}`}
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
                            inscription.status === "en_cours" || inscription.status === "confirmee" || inscription.status === "facturee"
                              ? "bg-accent border-primary/30 text-foreground"
                              : "bg-muted border-border text-muted-foreground"
                          }
                        >
                          {inscription.status === "en_cours" || inscription.status === "confirmee" || inscription.status === "facturee"
                            ? t(translations.statusConfirmed)
                            : t(translations.statusPending)}
                        </Badge>
                      </div>
                    </Link>
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
      </Tabs>
    </div>
  );
}
