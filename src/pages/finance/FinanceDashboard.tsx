import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { SeasonSelector } from "@/components/finance/SeasonSelector";
import { FinanceKPICard } from "@/components/finance/FinanceKPICard";
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
import { AlertCircle, DollarSign, CreditCard, Users, TrendingUp } from "lucide-react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const BRAND_GOLD = 'hsl(40, 97%, 54%)';
const BRAND_NAVY = 'hsl(219, 52%, 16%)';
const BRAND_GRAY = 'hsl(0, 0%, 90%)';
const BRAND_BLACK = 'hsl(0, 0%, 9%)';
const CHART_COLORS = [BRAND_GOLD, BRAND_NAVY, BRAND_GRAY, BRAND_BLACK];

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

  const { data: kpis } = useFinancialKPIs(startDate, endDate, true);
  const { data: caByMonth } = useCAByMonth(startDate, endDate, true);
  const { data: expensesByMonth } = useExpensesByMonth(startDate, endDate);
  const { data: caByType } = useCAByType(startDate, endDate);
  const { data: pendingInvoices } = usePendingInvoices();
  const { data: instructorBalance } = useInstructorBalance();

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

  // Horizontal bars: revenue vs real expenses per month
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

  const maxBarValue = useMemo(() => {
    if (!revenueVsExpenses.length) return 1;
    return Math.max(...revenueVsExpenses.flatMap((m) => [m.revenue, m.expenses]), 1);
  }, [revenueVsExpenses]);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Pilotage financier</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble, analyses et rentabilité — Factures, Paiements et Trésorerie ont leurs menus
          </p>
        </div>

        <PilotageSubnav />

        <div className="flex flex-wrap items-center gap-4">
          <PeriodSelector
            startDate={startDate}
            endDate={endDate}
            onPeriodChange={handlePeriodChange}
          />
          <SeasonSelector value={selectedSeasonId} onChange={handleSeasonChange} />
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FinanceKPICard
            title="CA Facturé"
            value={kpis?.caFacture || 0}
            subtitle={`${kpis?.nbFactures || 0} factures`}
            evolution={kpis?.caFactureEvol ?? undefined}
            variant="gold"
            formatAsPrice
            icon={DollarSign}
          />
          <FinanceKPICard
            title="Encaissé"
            value={kpis?.encaisse || 0}
            subtitle={`${formatPrice(kpis?.enAttente || 0)} en attente`}
            evolution={kpis?.encaisseEvol ?? undefined}
            variant="gold"
            formatAsPrice
            icon={CreditCard}
          />
          <FinanceKPICard
            title="À payer formateurs"
            value={kpis?.aPayerFormateurs || 0}
            subtitle={`${kpis?.formateursConcernes || 0} formateurs`}
            evolution={kpis?.aPayerFormateursEvol ?? undefined}
            variant="navy"
            formatAsPrice
            icon={Users}
          />
          <FinanceKPICard
            title="Marge brute"
            value={kpis?.margeBrute || 0}
            subtitle={`${kpis?.margePourcent?.toFixed(1) || 0}% du CA`}
            evolution={kpis?.margeBruteEvol ?? undefined}
            variant={kpis?.margePourcent && kpis.margePourcent >= 50 ? 'gold' : 'navy'}
            formatAsPrice
            icon={TrendingUp}
          />
        </div>

        {/* Charts Row: Horizontal Bars + Pie */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Receitas vs Despesas - Custom horizontal bars */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t(translations.revenueVsExpenses)}</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--fli-yellow))]" />
                    <span className="text-muted-foreground">{t(translations.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--fli-navy))]" />
                    <span className="text-muted-foreground">{t(translations.expenses)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueVsExpenses.length > 0 ? revenueVsExpenses.map((m, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize w-12">{m.label}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{formatPrice(m.revenue)}</span>
                        <span>{formatPrice(m.expenses)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[hsl(var(--fli-yellow))] transition-all duration-500"
                          style={{ width: `${(m.revenue / maxBarValue) * 100}%` }}
                        />
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[hsl(var(--fli-navy))] transition-all duration-500"
                          style={{ width: `${(m.expenses / maxBarValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Répartition par activité */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition par activité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {caByType?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number) => formatPrice(value)} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectifs saison (revenue_target) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Objectif CA
              {quarterlyGoals.seasonName ? ` — ${quarterlyGoals.seasonName}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quarterlyGoals.cible == null ? (
              <p className="text-sm text-muted-foreground">
                Aucun objectif renseigné pour cette saison. Saisissez{" "}
                <code className="text-xs">revenue_target</code> dans Administration → Saisons
                (BL-039). Les anciennes cibles 50&nbsp;000&nbsp;€ / 15 stagiaires / 60&nbsp;% ont
                été retirées.
              </p>
            ) : (
              <div className="space-y-2 max-w-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t(translations.quarterlyRevenue)}</span>
                  <span className="text-muted-foreground">
                    {formatPrice(quarterlyGoals.caTotal)} / {formatPrice(quarterlyGoals.cible)}
                    {quarterlyGoals.pct != null ? ` (${quarterlyGoals.pct}%)` : ""}
                  </span>
                </div>
                <Progress
                  value={quarterlyGoals.pct ?? 0}
                  className="h-2.5 [&>div]:bg-[hsl(var(--fli-yellow))]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <FinanceKpiGlossary />

        {/* CA Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution du CA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={caByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(v) => {
                      const date = new Date(v + '-01');
                      return date.toLocaleDateString('fr-FR', { month: 'short' });
                    }}
                    className="text-xs"
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [
                      formatPrice(value),
                      name === 'total' ? 'CA N' : 'CA N-1'
                    ]}
                    labelFormatter={(label) => {
                      const date = new Date(label + '-01');
                      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    }}
                  />
                  <Legend formatter={(value) => value === 'total' ? 'CA N' : 'CA N-1'} />
                  <Line type="monotone" dataKey="total" name="total" stroke={BRAND_GOLD} strokeWidth={2} dot={{ fill: BRAND_GOLD }} />
                  <Line type="monotone" dataKey="totalN1" name="totalN1" stroke={BRAND_NAVY} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: BRAND_NAVY }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Factures en attente</CardTitle>
              <Badge variant="secondary">{pendingInvoices?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices?.slice(0, 5).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="truncate max-w-[120px]">{invoice.client_name}</TableCell>
                      <TableCell className="text-right">{formatPrice(Number(invoice.amount_ttc || invoice.amount_ht))}</TableCell>
                      <TableCell>
                        {invoice.days_overdue > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            +{invoice.days_overdue}j
                          </Badge>
                        ) : (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!pendingInvoices || pendingInvoices.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucune facture en attente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Instructors to Pay */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Formateurs à payer</CardTitle>
              <Badge variant="secondary">{instructorBalance?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formateur</TableHead>
                    <TableHead className="text-right">À payer</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorBalance?.slice(0, 5).map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="font-medium">
                        {instructor.first_name} {instructor.last_name}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(instructor.a_payer)}
                      </TableCell>
                      {editable && (
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePayInstructor(instructor)}
                          >
                            Payer
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {(!instructorBalance || instructorBalance.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Tous les formateurs sont payés
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <InstructorPaymentDialog 
        open={paymentOpen} 
        onOpenChange={setPaymentOpen}
        instructor={selectedInstructor}
      />
    </MainLayout>
  );
}
