import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Euro,
  BookOpen,
  TrendingUp,
  UserPlus,
  GraduationCap,
  Languages,
  PieChart,
  ArrowRight,
  Activity,
  Filter,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInscriptions, useInscriptionStats } from "@/hooks/useInscriptions";
import { useUpcomingTests } from "@/hooks/useUpcomingTests";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardFunnel } from "@/hooks/useDashboardFunnel";
import { DashboardActionRail } from "@/components/dashboard/DashboardActionRail";
import { getStatusLabel } from "@/lib/inscription-status";
import {
  PageHeader,
  PageShell,
  SegmentedControl,
  SplitLayout,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  DonutChart,
  RankedBarList,
  TrendChart,
  Sparkline,
  FunnelBars,
  IconChip,
  TableSkeleton,
  TableEmpty,
  toneForStatus,
} from "@/components/ui-kit";
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
  noData: {
    fr: "Aucune donnée disponible",
    "pt-BR": "Nenhum dado disponível",
    en: "No data available",
  },
  byStatus: {
    fr: "Répartition par statut",
    "pt-BR": "Distribuição por status",
    en: "Breakdown by status",
  },
  byStatusDesc: {
    fr: "Ensemble du portefeuille d'inscriptions",
    "pt-BR": "Carteira completa de inscrições",
    en: "Whole enrollment portfolio",
  },
  byLanguage: {
    fr: "Langues les plus demandées",
    "pt-BR": "Idiomas mais procurados",
    en: "Most requested languages",
  },
  totalInscriptions: {
    fr: "inscriptions",
    "pt-BR": "inscrições",
    en: "enrollments",
  },
  openList: {
    fr: "Ouvrir la liste",
    "pt-BR": "Abrir a lista",
    en: "Open list",
  },
  activity: {
    fr: "Activité sur douze mois",
    "pt-BR": "Atividade em doze meses",
    en: "Twelve-month activity",
  },
  activityDesc: {
    fr: "Dossiers créés et chiffre d'affaires associé, par mois",
    "pt-BR": "Inscrições criadas e receita associada, por mês",
    en: "Enrolments created and associated revenue, by month",
  },
  seriesCount: {
    fr: "Inscriptions",
    "pt-BR": "Inscrições",
    en: "Enrolments",
  },
  seriesRevenue: {
    fr: "Montant (€)",
    "pt-BR": "Valor (€)",
    en: "Amount (€)",
  },
  funnel: {
    fr: "Entonnoir",
    "pt-BR": "Funil",
    en: "Funnel",
  },
  funnelDesc: {
    fr: "Du lead au dossier facturé — conversion d'une étape à la suivante",
    "pt-BR": "Do lead à inscrição faturada — conversão de etapa em etapa",
    en: "From lead to billed file — stage-to-stage conversion",
  },
  byModality: {
    fr: "Répartition par modalité",
    "pt-BR": "Distribuição por modalidade",
    en: "Breakdown by delivery mode",
  },
  vsPrevious: {
    fr: "vs 30 j précédents",
    "pt-BR": "vs 30 dias anteriores",
    en: "vs previous 30 days",
  },
  vsPrevMonth: {
    fr: "vs mois précédent",
    "pt-BR": "vs mês anterior",
    en: "vs previous month",
  },
};

/**
 * Tableau de bord de gestion.
 *
 * Structure : KPI cliquables → exceptions à traiter → activité récente et
 * répartitions. Chaque compteur mène à la liste filtrée correspondante ;
 * aucune valeur n'est simulée — les répartitions viennent de
 * `useInscriptionStats`, qui compte la table entière.
 */
export function DashboardGestao() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"inscriptions" | "tests">("inscriptions");

  const { data: inscriptions, isLoading: loadingInscriptions } = useInscriptions();
  const { data: upcomingTests, isLoading: loadingTests } = useUpcomingTests();
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: portfolio, isLoading: loadingPortfolio } = useInscriptionStats();
  const { data: funnel = [], isLoading: loadingFunnel } = useDashboardFunnel();

  const dateLocale = language === "pt-BR" ? ptBR : language === "en" ? enUS : fr;
  const localeTag = language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : "fr-FR";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(localeTag, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const recentInscriptions = inscriptions?.slice(0, 6) ?? [];

  /** Répartition par statut — comptage réel sur toute la table. */
  const statusSlices = useMemo(() => {
    if (!portfolio?.byStatus) return [];
    return Object.entries(portfolio.byStatus)
      .map(([status, count]) => ({
        name: getStatusLabel(status, language),
        value: count as number,
        href: `/inscriptions?status=${status}`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio, language]);

  /** Langues — les 6 premières, le reste replié par le composant. */
  const languageBars = useMemo(() => {
    if (!portfolio?.byLanguage) return [];
    return Object.entries(portfolio.byLanguage)
      .map(([name, count]) => ({
        key: name,
        label: name,
        value: count as number,
        href: `/inscriptions?language=${encodeURIComponent(name)}`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [portfolio]);

  /** Série mensuelle réelle : dossiers créés et montant associé. */
  const monthlySeries = useMemo(
    () =>
      (portfolio?.byMonth ?? []).map((month) => ({
        label: month.label,
        count: month.count,
        revenue: Math.round(month.revenue),
      })),
    [portfolio]
  );

  /** Répartition par modalité — présentiel, visio, non précisée. */
  const modalitySlices = useMemo(() => {
    if (!portfolio?.byModality) return [];
    return Object.entries(portfolio.byModality)
      .map(([name, count]) => ({ name, value: count as number }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const sparkPoints = useMemo(
    () => (stats?.newInscriptions.spark ?? []).map((point) => point.value),
    [stats]
  );

  return (
    <PageShell>
      <PageHeader
        title={t(translations.title)}
        description={t(translations.subtitle)}
        icon={TrendingUp}
        tone="gold"
        meta={
          <StatusPill tone="success" dot>
            {t(translations.updatedNow)}
          </StatusPill>
        }
      />

      {/* KPI — chaque tuile mène à la liste correspondante. */}
      <StatTileGrid cols={4}>
        <StatTile
          label={t(translations.newInscriptions)}
          value={stats?.newInscriptions.total ?? 0}
          hint={`${stats?.newInscriptions.confirmed ?? 0} ${t(translations.confirmed)}`}
          icon={UserPlus}
          tone="gold"
          to="/inscriptions"
          loading={loadingStats}
          delta={
            stats?.newInscriptions.evolution === null ||
            stats?.newInscriptions.evolution === undefined
              ? undefined
              : {
                  value: stats.newInscriptions.evolution,
                  label: t(translations.vsPrevious),
                }
          }
        >
          {sparkPoints.length > 1 && (
            <Sparkline
              points={sparkPoints}
              height={32}
              color="hsl(var(--chart-4))"
              ariaLabel={t(translations.newInscriptions)}
            />
          )}
        </StatTile>
        <StatTile
          label={t(translations.scheduledTests)}
          value={stats?.upcomingTests.total ?? 0}
          hint={t(translations.next7Days)}
          icon={GraduationCap}
          tone="blue"
          onClick={() => setActiveTab("tests")}
          loading={loadingStats}
        />
        <StatTile
          label={t(translations.monthlyForecast)}
          value={formatCurrency(stats?.monthlyRevenue.projected ?? 0)}
          hint={`${formatCurrency(stats?.monthlyRevenue.confirmed ?? 0)} ${t(translations.confirmed)}`}
          icon={Euro}
          tone="teal"
          to="/invoices"
          loading={loadingStats}
          delta={
            stats?.monthlyRevenue.evolution === null ||
            stats?.monthlyRevenue.evolution === undefined
              ? undefined
              : {
                  value: stats.monthlyRevenue.evolution,
                  label: t(translations.vsPrevMonth),
                }
          }
        />
        <StatTile
          label={t(translations.activeClasses)}
          value={stats?.activeClasses.total ?? 0}
          hint={
            (stats?.activeClasses.total ?? 0) === 0
              ? t(translations.noActiveClasses)
              : `${stats?.activeClasses.validated ?? 0} ${t(translations.confirmed_classes)}`
          }
          icon={BookOpen}
          tone="purple"
          to="/inscriptions?status=en_cours"
          loading={loadingStats}
        />
      </StatTileGrid>

      <DashboardActionRail />

      {/* Deux mesures d'ordres de grandeur différents : deux graphiques à axe
          unique côte à côte, jamais deux axes sur un même dessin. */}
      <div className="grid gap-4 lg:gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SurfaceCard
          title={t(translations.activity)}
          description={t(translations.activityDesc)}
          icon={Activity}
        >
          {loadingPortfolio ? (
            <div className="h-[260px] animate-shimmer rounded-[var(--radius)]" />
          ) : (
            <div className="space-y-5">
              <TrendChart
                data={monthlySeries}
                series={[{ key: "count", label: t(translations.seriesCount) }]}
                xKey="label"
                variant="area"
                height={150}
                yDomain={[0, "auto"]}
                ariaLabel={t(translations.activity)}
                emptyMessage={t(translations.noData)}
              />
              <TrendChart
                data={monthlySeries}
                series={[
                  {
                    key: "revenue",
                    label: t(translations.seriesRevenue),
                    color: "hsl(var(--chart-3))",
                  },
                ]}
                xKey="label"
                variant="area"
                height={130}
                yDomain={[0, "auto"]}
                formatAxisValue={(value) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                }
                formatValue={(value) => formatCurrency(Number(value))}
                ariaLabel={t(translations.seriesRevenue)}
                emptyMessage={t(translations.noData)}
              />
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard
          title={t(translations.funnel)}
          description={t(translations.funnelDesc)}
          icon={Filter}
        >
          {loadingFunnel ? (
            <div className="space-y-4">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="h-9 animate-shimmer rounded-[var(--radius)]" />
              ))}
            </div>
          ) : (
            <FunnelBars stages={funnel} emptyMessage={t(translations.noData)} />
          )}
        </SurfaceCard>
      </div>

      <SplitLayout
        main={
          <SurfaceCard
            title={
              activeTab === "inscriptions"
                ? t(translations.recentInscriptions)
                : t(translations.testReservations)
            }
            description={
              activeTab === "inscriptions"
                ? t(translations.recentInscriptionsDesc)
                : t(translations.testReservationsDesc)
            }
            actions={
              <>
                <SegmentedControl<"inscriptions" | "tests">
                  value={activeTab}
                  onChange={setActiveTab}
                  size="sm"
                  ariaLabel={t(translations.title)}
                  options={[
                    { value: "inscriptions", label: t(translations.tabInscriptions), icon: UserPlus },
                    { value: "tests", label: t(translations.tabTests), icon: GraduationCap },
                  ]}
                />
                {activeTab === "inscriptions" && (
                  <Link
                    to="/inscriptions"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
                  >
                    {t(translations.seeAll)}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </>
            }
            flush
          >
            {activeTab === "inscriptions" ? (
              loadingInscriptions ? (
                <TableSkeleton rows={5} cols={4} />
              ) : recentInscriptions.length === 0 ? (
                <TableEmpty title={t(translations.noData)} icon={UserPlus} />
              ) : (
                <ul className="divide-y divide-border">
                  {recentInscriptions.map((inscription) => (
                    <li key={inscription.id}>
                      <Link
                        to={`/inscriptions/${inscription.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--surface-sunken))] sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-primary/12 text-xs font-semibold text-[hsl(var(--tint-gold-fg))]">
                            {(inscription.student_name || "?")
                              .split(" ")
                              .filter(Boolean)
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{inscription.student_name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {inscription.language}
                              {inscription.code ? ` · ${inscription.code}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="hidden text-sm tabular text-muted-foreground sm:inline">
                            {inscription.start_date
                              ? format(new Date(inscription.start_date), "dd MMM yyyy", {
                                  locale: dateLocale,
                                })
                              : "—"}
                          </span>
                          <StatusPill tone={toneForStatus(inscription.status)} size="sm">
                            {getStatusLabel(inscription.status, language)}
                          </StatusPill>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : loadingTests ? (
              <TableSkeleton rows={4} cols={3} />
            ) : !upcomingTests || upcomingTests.length === 0 ? (
              <TableEmpty title={t(translations.noData)} icon={GraduationCap} />
            ) : (
              <ul className="divide-y divide-border">
                {upcomingTests.map((test) => (
                  <li
                    key={test.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip icon={GraduationCap} tone="blue" size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{test.candidate_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{test.test_type}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium tabular">{test.test_date}</p>
                      <p className="text-xs text-muted-foreground tabular">{test.test_time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        }
        rail={
          <>
            <SurfaceCard
              title={t(translations.byStatus)}
              description={t(translations.byStatusDesc)}
              icon={PieChart}
            >
              {loadingPortfolio ? (
                <div className="h-[220px] animate-shimmer rounded-[var(--radius)]" />
              ) : (
                <DonutChart
                  data={statusSlices}
                  height={180}
                  legendPosition="bottom"
                  centerLabel={t(translations.totalInscriptions)}
                  ariaLabel={t(translations.byStatus)}
                  emptyMessage={t(translations.noData)}
                />
              )}
            </SurfaceCard>

            <SurfaceCard
              title={t(translations.byLanguage)}
              icon={Languages}
              actions={
                <Link
                  to="/inscriptions"
                  className="text-sm font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
                >
                  {t(translations.openList)}
                </Link>
              }
            >
              {loadingPortfolio ? (
                <div className="space-y-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="h-8 animate-shimmer rounded-[var(--radius)]" />
                  ))}
                </div>
              ) : (
                <RankedBarList items={languageBars} colorBySeries emptyMessage={t(translations.noData)} />
              )}
            </SurfaceCard>

            <SurfaceCard title={t(translations.byModality)} icon={BookOpen}>
              {loadingPortfolio ? (
                <div className="h-[180px] animate-shimmer rounded-[var(--radius)]" />
              ) : (
                <DonutChart
                  data={modalitySlices}
                  height={170}
                  thickness={18}
                  legendPosition="bottom"
                  centerLabel={t(translations.totalInscriptions)}
                  ariaLabel={t(translations.byModality)}
                  emptyMessage={t(translations.noData)}
                />
              )}
            </SurfaceCard>
          </>
        }
      />
    </PageShell>
  );
}
