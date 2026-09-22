import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { SeasonSelector } from "@/components/finance/SeasonSelector";
import { FinanceKpiGlossary } from "@/components/finance/FinanceKpiGlossary";
import { InstructorPaymentDialog } from "@/components/finance/InstructorPaymentDialog";
import { PilotageSubnav } from "@/components/finance/PilotageSubnav";
import { useSeasons } from "@/hooks/useSeasons";
import {
  useFinancialKPIs,
  useCAByMonth,
  useExpensesByMonth,
  useCAByType,
  usePendingInvoices,
  useInstructorBalance,
} from "@/hooks/useFinancialDashboard";
import { useFinancialRealtime } from "@/hooks/useFinancialRealtime";
import { progressTowardTarget, resolveRevenueTarget } from "@/lib/finance-pilotage";
import {
  AlertCircle,
  DollarSign,
  CreditCard,
  Users,
  TrendingUp,
  PieChart,
  Target,
  FileText,
  LineChart as LineChartIcon,
  Scale,
} from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  BarsChart,
  CardList,
  CardListItem,
  DonutChart,
  MeterRow,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
  TrendChart,
} from "@/components/ui-kit";

const translations = {
  revenueVsExpenses: { fr: 'Recettes vs Dépenses', 'pt-BR': 'Receitas vs Despesas', en: 'Revenue vs Expenses' },
  revenue: { fr: 'Recettes', 'pt-BR': 'Receitas', en: 'Revenue' },
  expenses: { fr: 'Dépenses', 'pt-BR': 'Despesas', en: 'Expenses' },
  quarterlyRevenue: { fr: 'CA Trimestriel', 'pt-BR': 'Receita Trimestral', en: 'Quarterly Revenue' },
  newTrainees: { fr: 'Nouveaux stagiaires', 'pt-BR': 'Novos Estagiários', en: 'New Trainees' },
  quarterlyGoals: { fr: 'Objectifs du trimestre', 'pt-BR': 'Metas do Trimestre', en: 'Quarterly Goals' },
};

export default function FinanceDashboard() {
  const today = new Date();
  const { data: seasons } = useSeasons();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

  useFinancialRealtime();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("finance");
  const { t } = useLanguage();

  const { data: kpis, isLoading: loadingKpis } = useFinancialKPIs(startDate, endDate, true);
  const { data: caByMonth, isLoading: loadingCaByMonth } = useCAByMonth(startDate, endDate, true);
  const { data: expensesByMonth } = useExpensesByMonth(startDate, endDate);
  const { data: caByType, isLoading: loadingCaByType } = useCAByType(startDate, endDate);
  const { data: pendingInvoices, isLoading: loadingPending } = usePendingInvoices();
  const { data: instructorBalance, isLoading: loadingBalance } = useInstructorBalance();

  const selectedSeason = useMemo(
    () => seasons?.find((s) => s.id === selectedSeasonId) ?? seasons?.find((s) => s.is_current) ?? null,
    [seasons, selectedSeasonId]
  );
  const revenueTarget = resolveRevenueTarget(selectedSeason);

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSeasonChange = (seasonId: string | undefined, start?: string, end?: string) => {
    setSelectedSeasonId(seasonId);
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handlePayInstructor = (instructor: any) => {
    setSelectedInstructor(instructor);
    setPaymentOpen(true);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatAxisPrice = (value: number) => `${Math.round(value / 1000)}k`;

  // Recettes vs dépenses réelles par mois — même échelle (euros), un seul axe Y.
  const revenueVsExpenses = useMemo(() => {
    if (!caByMonth) return [];
    const expenseMap = new Map((expensesByMonth || []).map((e) => [e.month, e.total]));
    return caByMonth.map((m) => {
      const date = new Date(m.month + "-01");
      return {
        label: date.toLocaleDateString("fr-FR", { month: "short" }),
        revenue: m.total,
        expenses: expenseMap.get(m.month) ?? 0,
      };
    });
  }, [caByMonth, expensesByMonth]);

  // Évolution du CA : libellés d'axe pré-calculés (court) + libellé long en infobulle.
  const caEvolution = useMemo(
    () =>
      (caByMonth ?? []).map((m) => {
        const date = new Date(m.month + "-01");
        return {
          label: date.toLocaleDateString("fr-FR", { month: "short" }),
          fullLabel: date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
          total: m.total,
          totalN1: m.totalN1,
        };
      }),
    [caByMonth]
  );

  const caEvolutionLabels = useMemo(
    () => new Map(caEvolution.map((m) => [m.label, m.fullLabel])),
    [caEvolution]
  );

  const activitySlices = useMemo(
    () => (caByType ?? []).map((item) => ({ name: item.name, value: item.value })),
    [caByType]
  );

  // Objectifs depuis seasons.revenue_target (BL-039) — plus de cibles inventées
  const quarterlyGoals = useMemo(() => {
    const caTotal = kpis?.caFacture || 0;
    const cible = revenueTarget;
    const pct = progressTowardTarget(caTotal, cible);
    return {
      caTotal,
      cible,
      pct,
      seasonName: selectedSeason?.name ?? null,
    };
  }, [kpis, revenueTarget, selectedSeason?.name]);

  const periodLabel = `${format(new Date(startDate), "dd/MM/yyyy")} – ${format(new Date(endDate), "dd/MM/yyyy")}`;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Pilotage financier"
          description="Vue d'ensemble, analyses et rentabilité — Factures, Paiements et Trésorerie ont leurs menus"
          icon={TrendingUp}
          tone="gold"
          actions={
            <>
              <PeriodSelector
                startDate={startDate}
                endDate={endDate}
                onPeriodChange={handlePeriodChange}
              />
              <SeasonSelector value={selectedSeasonId} onChange={handleSeasonChange} />
            </>
          }
          tabs={<PilotageSubnav />}
        />

        {/* KPI — chaque tuile mène à la liste correspondante. */}
        <StatTileGrid cols={4}>
          <StatTile
            label="CA Facturé"
            value={formatPrice(kpis?.caFacture || 0)}
            hint={`${kpis?.nbFactures || 0} factures`}
            icon={DollarSign}
            tone="gold"
            to="/invoices"
            loading={loadingKpis}
            delta={
              kpis?.caFactureEvol != null
                ? { value: kpis.caFactureEvol, label: "vs N-1" }
                : undefined
            }
          />
          <StatTile
            label="Encaissé"
            value={formatPrice(kpis?.encaisse || 0)}
            hint={`${formatPrice(kpis?.enAttente || 0)} en attente`}
            icon={CreditCard}
            tone="teal"
            to="/finance/payments"
            loading={loadingKpis}
            delta={
              kpis?.encaisseEvol != null
                ? { value: kpis.encaisseEvol, label: "vs N-1" }
                : undefined
            }
          />
          <StatTile
            label="À payer formateurs"
            value={formatPrice(kpis?.aPayerFormateurs || 0)}
            hint={`${kpis?.formateursConcernes || 0} formateurs`}
            icon={Users}
            tone="navy"
            to="/finance/analyses"
            loading={loadingKpis}
            delta={
              kpis?.aPayerFormateursEvol != null
                ? { value: kpis.aPayerFormateursEvol, label: "vs N-1", inverted: true }
                : undefined
            }
          />
          <StatTile
            label="Marge brute"
            value={formatPrice(kpis?.margeBrute || 0)}
            hint={`${kpis?.margePourcent?.toFixed(1) || 0}% du CA`}
            icon={TrendingUp}
            tone={kpis?.margePourcent && kpis.margePourcent >= 50 ? 'gold' : 'navy'}
            to="/finance/rentabilite"
            loading={loadingKpis}
            delta={
              kpis?.margeBruteEvol != null
                ? { value: kpis.margeBruteEvol, label: "vs N-1" }
                : undefined
            }
          />
        </StatTileGrid>

        {/* Graphiques : comparaison mensuelle + répartition */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <SurfaceCard
            title={t(translations.revenueVsExpenses)}
            description={`Factures et dépenses réelles · ${periodLabel}`}
            icon={Scale}
          >
            {loadingCaByMonth ? (
              <div className="h-[280px] animate-shimmer rounded-[var(--radius)]" />
            ) : (
              <BarsChart
                data={revenueVsExpenses}
                xKey="label"
                height={280}
                series={[
                  { key: "revenue", label: t(translations.revenue) },
                  { key: "expenses", label: t(translations.expenses) },
                ]}
                formatValue={(value) => formatPrice(Number(value))}
                formatAxisValue={formatAxisPrice}
                ariaLabel={t(translations.revenueVsExpenses)}
                emptyMessage="Aucune donnée"
              />
            )}
          </SurfaceCard>

          <SurfaceCard
            title="Répartition par activité"
            description={`CA facturé par type d'activité · ${periodLabel}`}
            icon={PieChart}
          >
            {loadingCaByType ? (
              <div className="h-[260px] animate-shimmer rounded-[var(--radius)]" />
            ) : (
              <DonutChart
                data={activitySlices}
                height={240}
                legendPosition="side"
                centerLabel="CA facturé"
                formatValue={formatPrice}
                ariaLabel="Répartition du CA par activité"
                emptyMessage="Aucune donnée"
              />
            )}
          </SurfaceCard>
        </div>

        {/* Objectifs saison (revenue_target) */}
        <SurfaceCard
          title={`Objectif CA${quarterlyGoals.seasonName ? ` — ${quarterlyGoals.seasonName}` : ""}`}
          description="Source : seasons.revenue_target (BL-039)"
          icon={Target}
        >
          {quarterlyGoals.cible == null ? (
            <p className="text-sm text-muted-foreground">
              Aucun objectif renseigné pour cette saison. Saisissez{" "}
              <code className="text-xs">revenue_target</code> dans Administration → Saisons
              (BL-039). Les anciennes cibles 50&nbsp;000&nbsp;€ / 15 stagiaires / 60&nbsp;% ont
              été retirées.
            </p>
          ) : (
            <div className="max-w-md">
              <MeterRow
                label={t(translations.quarterlyRevenue)}
                value={quarterlyGoals.caTotal}
                max={quarterlyGoals.cible}
                display={
                  <>
                    {formatPrice(quarterlyGoals.caTotal)} / {formatPrice(quarterlyGoals.cible)}
                    {quarterlyGoals.pct != null ? ` (${quarterlyGoals.pct}%)` : ""}
                  </>
                }
              />
            </div>
          )}
        </SurfaceCard>

        <FinanceKpiGlossary />

        {/* CA Evolution */}
        <SurfaceCard
          title="Évolution du CA"
          description="CA facturé du mois, comparé au même mois de l'exercice précédent"
          icon={LineChartIcon}
        >
          {loadingCaByMonth ? (
            <div className="h-[300px] animate-shimmer rounded-[var(--radius)]" />
          ) : (
            <TrendChart
              data={caEvolution}
              xKey="label"
              variant="line"
              height={300}
              series={[
                { key: "total", label: "CA N" },
                { key: "totalN1", label: "CA N-1", dashed: true },
              ]}
              formatValue={(value) => formatPrice(Number(value))}
              formatAxisValue={formatAxisPrice}
              formatLabel={(label) => caEvolutionLabels.get(String(label)) ?? String(label)}
              ariaLabel="Évolution du CA facturé"
              emptyMessage="Aucune donnée"
            />
          )}
        </SurfaceCard>

        {/* Tables */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          {/* Pending Invoices */}
          <SurfaceCard
            title="Factures en attente"
            description="Brouillons et factures envoyées non réglées"
            icon={FileText}
            actions={
              <>
                <StatusPill tone="neutral">{pendingInvoices?.length || 0}</StatusPill>
                <Link
                  to="/invoices?status=sent"
                  className="text-sm font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
                >
                  Voir tout
                </Link>
              </>
            }
            flush
          >
            {loadingPending ? (
              <TableSkeleton rows={5} cols={4} />
            ) : !pendingInvoices || pendingInvoices.length === 0 ? (
              <TableEmpty title="Aucune facture en attente" icon={FileText} />
            ) : (
              <>
                <TableFrame className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>N° Facture</TableHeadCell>
                        <TableHeadCell>Client</TableHeadCell>
                        <TableHeadCell align="right">Montant</TableHeadCell>
                        <TableHeadCell>Statut</TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {pendingInvoices.slice(0, 5).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_number ? (
                              <Link
                                to={`/invoices?q=${encodeURIComponent(invoice.invoice_number)}`}
                                className="text-[hsl(var(--tint-blue-fg))] hover:underline"
                              >
                                {invoice.invoice_number}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate">{invoice.client_name}</TableCell>
                          <TableCell align="right" className="tabular font-medium">
                            {formatPrice(Number(invoice.amount_ttc || invoice.amount_ht))}
                          </TableCell>
                          <TableCell>
                            {invoice.days_overdue > 0 ? (
                              <StatusPill tone="danger" icon={AlertCircle} size="sm">
                                +{invoice.days_overdue}j
                              </StatusPill>
                            ) : (
                              <StatusPill tone="warning" size="sm">En attente</StatusPill>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </TableFrame>

                <CardList className="md:hidden">
                  {pendingInvoices.slice(0, 5).map((invoice) => (
                    <CardListItem
                      key={invoice.id}
                      title={invoice.invoice_number || "—"}
                      subtitle={invoice.client_name}
                      to={
                        invoice.invoice_number
                          ? `/invoices?q=${encodeURIComponent(invoice.invoice_number)}`
                          : undefined
                      }
                      meta={
                        invoice.days_overdue > 0 ? (
                          <StatusPill tone="danger" icon={AlertCircle} size="sm">
                            +{invoice.days_overdue}j
                          </StatusPill>
                        ) : (
                          <StatusPill tone="warning" size="sm">En attente</StatusPill>
                        )
                      }
                      fields={[
                        {
                          label: "Montant",
                          value: formatPrice(Number(invoice.amount_ttc || invoice.amount_ht)),
                        },
                      ]}
                    />
                  ))}
                </CardList>
              </>
            )}
          </SurfaceCard>

          {/* Instructors to Pay */}
          <SurfaceCard
            title="Formateurs à payer"
            description="Solde dû par formateur, tous exercices confondus"
            icon={Users}
            actions={<StatusPill tone="neutral">{instructorBalance?.length || 0}</StatusPill>}
            flush
          >
            {loadingBalance ? (
              <TableSkeleton rows={5} cols={3} />
            ) : !instructorBalance || instructorBalance.length === 0 ? (
              <TableEmpty title="Tous les formateurs sont payés" icon={Users} />
            ) : (
              <>
                <TableFrame className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>Formateur</TableHeadCell>
                        <TableHeadCell align="right">À payer</TableHeadCell>
                        <TableHeadCell align="right">
                          <span className="sr-only">Actions</span>
                        </TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {instructorBalance.slice(0, 5).map((instructor) => (
                        <TableRow key={instructor.id}>
                          <TableCell className="font-medium">
                            <Link
                              to={`/formateurs/${instructor.id}`}
                              className="hover:text-[hsl(var(--tint-blue-fg))] hover:underline"
                            >
                              {instructor.first_name} {instructor.last_name}
                            </Link>
                          </TableCell>
                          <TableCell align="right" className="tabular font-medium">
                            {formatPrice(instructor.a_payer)}
                          </TableCell>
                          <TableCell align="right">
                            {editable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePayInstructor(instructor)}
                              >
                                Payer
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </TableFrame>

                <CardList className="md:hidden">
                  {instructorBalance.slice(0, 5).map((instructor) => (
                    <CardListItem
                      key={instructor.id}
                      title={`${instructor.first_name} ${instructor.last_name}`}
                      fields={[{ label: "À payer", value: formatPrice(instructor.a_payer) }]}
                      actions={
                        editable ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePayInstructor(instructor)}
                          >
                            Payer
                          </Button>
                        ) : undefined
                      }
                    />
                  ))}
                </CardList>
              </>
            )}
          </SurfaceCard>
        </div>
      </PageShell>

      <InstructorPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        instructor={selectedInstructor}
      />
    </MainLayout>
  );
}
