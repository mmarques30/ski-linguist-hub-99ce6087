import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { AnalysesKPIGrid } from "@/components/finance/AnalysesKPIGrid";
import { RevenueChart } from "@/components/finance/RevenueChart";
import { RevenueSources } from "@/components/finance/RevenueSources";
import { QuarterlyForecast } from "@/components/finance/QuarterlyForecast";
import { PilotageSubnav } from "@/components/finance/PilotageSubnav";
import { useCAByType, useCAByMonth, useInstructorBalance, useFinancialKPIs } from "@/hooks/useFinancialDashboard";
import { BarChart3, Download, LayoutDashboard, Table2, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  CardList,
  CardListItem,
  PageHeader,
  PageShell,
  SegmentedControl,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
} from "@/components/ui-kit";

type AnalysesView = "dashboard" | "tableaux";

export default function FinanceAnalyses() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [view, setView] = useState<AnalysesView>("dashboard");

  const { data: caByType, isLoading: loadingCaByType } = useCAByType(startDate, endDate, true);
  const { data: caByMonth } = useCAByMonth(startDate, endDate, true);
  const { data: kpis } = useFinancialKPIs(startDate, endDate, true);
  const { data: instructorBalance, isLoading: loadingBalance } = useInstructorBalance();

  const { data: caByClient, isLoading: loadingCaByClient } = useQuery({
    queryKey: ['ca-by-client', startDate, endDate],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          amount_ht,
          inscription:inscription_id (
            ski_school:ski_school_id ( id, name ),
            student:student_id ( id, company, first_name, last_name )
          )
        `)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .neq('status', 'cancelled');

      const byClient = new Map<string, { name: string; total: number; count: number }>();
      invoices?.forEach(inv => {
        const clientName = inv.inscription?.ski_school?.name || 
          inv.inscription?.student?.company || 
          `${inv.inscription?.student?.first_name || ''} ${inv.inscription?.student?.last_name || ''}`.trim() ||
          'Client inconnu';
        const clientId = inv.inscription?.ski_school?.id || inv.inscription?.student?.id || 'unknown';
        if (!byClient.has(clientId)) {
          byClient.set(clientId, { name: clientName, total: 0, count: 0 });
        }
        const entry = byClient.get(clientId)!;
        entry.total += Number(inv.amount_ht || 0);
        entry.count += 1;
      });
      return Array.from(byClient.values()).sort((a, b) => b.total - a.total);
    },
  });

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row => headers.map(h => row[h]).join(';'))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const evolutionClass = (evolution: number) =>
    evolution >= 0 ? "text-[hsl(var(--status-good))]" : "text-[hsl(var(--status-critical))]";

  const caTypeTotal = caByType?.reduce((sum, i) => sum + i.value, 0) ?? 0;
  const caTypeTotalN1 = caByType?.reduce((sum, i) => sum + i.valueN1, 0) ?? 0;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Pilotage financier"
          description="Analyse détaillée par activité, client et formateur"
          icon={BarChart3}
          tone="blue"
          actions={
            <PeriodSelector startDate={startDate} endDate={endDate} onPeriodChange={handlePeriodChange} />
          }
          tabs={<PilotageSubnav />}
        />

        <SegmentedControl<AnalysesView>
          value={view}
          onChange={setView}
          ariaLabel="Vue analyses"
          options={[
            { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { value: "tableaux", label: "Tableaux", icon: Table2 },
          ]}
        />

        {view === "dashboard" ? (
          <div className="space-y-4 lg:space-y-5">
            <AnalysesKPIGrid
              caByType={caByType}
              caByClient={caByClient}
              kpis={kpis}
              startDate={startDate}
              endDate={endDate}
            />
            <RevenueChart caByMonth={caByMonth} />
            <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
              <RevenueSources caByType={caByType} />
              <QuarterlyForecast caByMonth={caByMonth} />
            </div>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-5">
            <SurfaceCard
              title="CA par type d'activité"
              description="CA facturé de la période, comparé à l'exercice précédent"
              icon={BarChart3}
              flush
            >
              {loadingCaByType ? (
                <TableSkeleton rows={4} cols={5} />
              ) : !caByType || caByType.length === 0 ? (
                <TableEmpty
                  title="Aucun CA sur la période"
                  description="Aucune facture n'a été émise sur la période sélectionnée."
                  icon={BarChart3}
                />
              ) : (
                <>
                  <TableFrame className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <TableHeadRow>
                          <TableHeadCell>Activité</TableHeadCell>
                          <TableHeadCell align="right">CA N</TableHeadCell>
                          <TableHeadCell align="right">CA N-1</TableHeadCell>
                          <TableHeadCell align="right">Évolution</TableHeadCell>
                          <TableHeadCell align="right">% du total</TableHeadCell>
                        </TableHeadRow>
                      </thead>
                      <tbody>
                        {caByType.map((item) => {
                          const percent = caTypeTotal > 0 ? (item.value / caTypeTotal) * 100 : 0;
                          return (
                            <TableRow key={item.type}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell align="right" className="tabular">{formatPrice(item.value)}</TableCell>
                              <TableCell align="right" className="tabular text-muted-foreground" hideBelow="lg">
                                {formatPrice(item.valueN1)}
                              </TableCell>
                              <TableCell align="right" className="tabular">
                                {item.evolution !== null ? (
                                  <span className={evolutionClass(item.evolution)}>
                                    {item.evolution >= 0 ? '+' : ''}{item.evolution.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell align="right" className="tabular">{percent.toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-[hsl(var(--surface-sunken))] font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell align="right" className="tabular">{formatPrice(caTypeTotal)}</TableCell>
                          <TableCell align="right" className="tabular text-muted-foreground" hideBelow="lg">
                            {formatPrice(caTypeTotalN1)}
                          </TableCell>
                          <TableCell align="right" className="tabular">
                            {caTypeTotalN1 === 0 ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              (() => {
                                const evol = ((caTypeTotal - caTypeTotalN1) / caTypeTotalN1) * 100;
                                return (
                                  <span className={evolutionClass(evol)}>
                                    {evol >= 0 ? '+' : ''}{evol.toFixed(1)}%
                                  </span>
                                );
                              })()
                            )}
                          </TableCell>
                          <TableCell align="right" className="tabular">100%</TableCell>
                        </TableRow>
                      </tbody>
                    </table>
                  </TableFrame>

                  <CardList className="md:hidden">
                    {caByType.map((item) => {
                      const percent = caTypeTotal > 0 ? (item.value / caTypeTotal) * 100 : 0;
                      return (
                        <CardListItem
                          key={item.type}
                          title={item.name}
                          meta={
                            item.evolution !== null ? (
                              <span className={cn("text-sm font-medium tabular", evolutionClass(item.evolution))}>
                                {item.evolution >= 0 ? '+' : ''}{item.evolution.toFixed(1)}%
                              </span>
                            ) : undefined
                          }
                          fields={[
                            { label: "CA N", value: formatPrice(item.value) },
                            { label: "CA N-1", value: formatPrice(item.valueN1) },
                            { label: "% du total", value: `${percent.toFixed(1)}%` },
                          ]}
                        />
                      );
                    })}
                    <CardListItem
                      title="Total"
                      fields={[
                        { label: "CA N", value: formatPrice(caTypeTotal) },
                        { label: "CA N-1", value: formatPrice(caTypeTotalN1) },
                        { label: "% du total", value: "100%" },
                      ]}
                    />
                  </CardList>
                </>
              )}
            </SurfaceCard>

            <SurfaceCard
              title="CA par client / ESF"
              description="CA HT facturé sur la période, par client"
              icon={Users}
              flush
            >
              {loadingCaByClient ? (
                <TableSkeleton rows={4} cols={3} />
              ) : !caByClient || caByClient.length === 0 ? (
                <TableEmpty
                  title="Aucun client facturé"
                  description="Aucune facture n'a été émise sur la période sélectionnée."
                  icon={Users}
                />
              ) : (
                <>
                  <TableFrame className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <TableHeadRow>
                          <TableHeadCell>Client</TableHeadCell>
                          <TableHeadCell align="right">CA HT</TableHeadCell>
                          <TableHeadCell align="right">Nb factures</TableHeadCell>
                        </TableHeadRow>
                      </thead>
                      <tbody>
                        {caByClient.map((client, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell align="right" className="tabular">{formatPrice(client.total)}</TableCell>
                            <TableCell align="right" className="tabular">{client.count}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[hsl(var(--surface-sunken))] font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell align="right" className="tabular">
                            {formatPrice(caByClient.reduce((sum, c) => sum + c.total, 0))}
                          </TableCell>
                          <TableCell align="right" className="tabular">
                            {caByClient.reduce((sum, c) => sum + c.count, 0)}
                          </TableCell>
                        </TableRow>
                      </tbody>
                    </table>
                  </TableFrame>

                  <CardList className="md:hidden">
                    {caByClient.map((client, idx) => (
                      <CardListItem
                        key={idx}
                        title={client.name}
                        fields={[
                          { label: "CA HT", value: formatPrice(client.total) },
                          { label: "Nb factures", value: client.count },
                        ]}
                      />
                    ))}
                    <CardListItem
                      title="Total"
                      fields={[
                        {
                          label: "CA HT",
                          value: formatPrice(caByClient.reduce((sum, c) => sum + c.total, 0)),
                        },
                        {
                          label: "Nb factures",
                          value: caByClient.reduce((sum, c) => sum + c.count, 0),
                        },
                      ]}
                    />
                  </CardList>
                </>
              )}
            </SurfaceCard>

            <SurfaceCard
              title="Balance formateurs"
              description="Dû, payé et reste à payer par formateur"
              icon={Users}
              actions={
                <Button variant="outline" size="sm" onClick={() => exportCSV(
                  instructorBalance?.map(i => ({
                    Formateur: `${i.first_name} ${i.last_name}`,
                    Total_du: i.total_du,
                    Total_paye: i.total_paye,
                    A_payer: i.a_payer,
                  })) || [], 'balance-formateurs'
                )}>
                  <Download className="mr-2 h-4 w-4" />Export CSV
                </Button>
              }
              flush
            >
              {loadingBalance ? (
                <TableSkeleton rows={4} cols={4} />
              ) : !instructorBalance || instructorBalance.length === 0 ? (
                <TableEmpty
                  title="Tous les formateurs sont payés"
                  description="Aucun solde restant à payer."
                  icon={Users}
                />
              ) : (
                <>
                  <TableFrame className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <TableHeadRow>
                          <TableHeadCell>Formateur</TableHeadCell>
                          <TableHeadCell align="right">Total dû</TableHeadCell>
                          <TableHeadCell align="right">Payé</TableHeadCell>
                          <TableHeadCell align="right">À payer</TableHeadCell>
                        </TableHeadRow>
                      </thead>
                      <tbody>
                        {instructorBalance.map((inst) => (
                          <TableRow key={inst.id}>
                            <TableCell className="font-medium">
                              <Link
                                to={`/formateurs/${inst.id}`}
                                className="hover:text-[hsl(var(--tint-blue-fg))] hover:underline"
                              >
                                {inst.first_name} {inst.last_name}
                              </Link>
                            </TableCell>
                            <TableCell align="right" className="tabular">{formatPrice(inst.total_du)}</TableCell>
                            <TableCell align="right" className="tabular text-[hsl(var(--status-good))]" hideBelow="lg">
                              {formatPrice(inst.total_paye)}
                            </TableCell>
                            <TableCell align="right" className="font-medium tabular">
                              {formatPrice(inst.a_payer)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[hsl(var(--surface-sunken))] font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell align="right" className="tabular">
                            {formatPrice(instructorBalance.reduce((sum, i) => sum + i.total_du, 0))}
                          </TableCell>
                          <TableCell align="right" className="tabular text-[hsl(var(--status-good))]" hideBelow="lg">
                            {formatPrice(instructorBalance.reduce((sum, i) => sum + i.total_paye, 0))}
                          </TableCell>
                          <TableCell align="right" className="tabular">
                            {formatPrice(instructorBalance.reduce((sum, i) => sum + i.a_payer, 0))}
                          </TableCell>
                        </TableRow>
                      </tbody>
                    </table>
                  </TableFrame>

                  <CardList className="md:hidden">
                    {instructorBalance.map((inst) => (
                      <CardListItem
                        key={inst.id}
                        title={`${inst.first_name} ${inst.last_name}`}
                        to={`/formateurs/${inst.id}`}
                        fields={[
                          { label: "Total dû", value: formatPrice(inst.total_du) },
                          { label: "Payé", value: formatPrice(inst.total_paye) },
                          { label: "À payer", value: formatPrice(inst.a_payer) },
                        ]}
                      />
                    ))}
                    <CardListItem
                      title="Total"
                      fields={[
                        {
                          label: "Total dû",
                          value: formatPrice(instructorBalance.reduce((sum, i) => sum + i.total_du, 0)),
                        },
                        {
                          label: "Payé",
                          value: formatPrice(instructorBalance.reduce((sum, i) => sum + i.total_paye, 0)),
                        },
                        {
                          label: "À payer",
                          value: formatPrice(instructorBalance.reduce((sum, i) => sum + i.a_payer, 0)),
                        },
                      ]}
                    />
                  </CardList>
                </>
              )}
            </SurfaceCard>
          </div>
        )}
      </PageShell>
    </MainLayout>
  );
}
