import { useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  TresorerieSubnav,
  useTresorerieTab,
} from "@/components/finance/PilotageSubnav";
import { useTresoreriePrevisionnelle } from "@/hooks/useFinancialDashboard";
import {
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Info,
  LineChart as LineChartIcon,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navigate } from "react-router-dom";
import {
  CardList,
  CardListItem,
  IconChip,
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

export default function FinanceTresorerie() {
  const tab = useTresorerieTab();
  const { data: tresorerie, isLoading } = useTresoreriePrevisionnelle(6);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  let cumulativeBalance = 0;
  const tresorerieWithCumulative = tresorerie?.map((m) => {
    cumulativeBalance += m.solde;
    return { ...m, soldeCumulatif: cumulativeBalance };
  });

  const hasNegativeBalance = tresorerieWithCumulative?.some(m => m.soldeCumulatif < 0);

  // KPI summaries
  const summaryKPIs = useMemo(() => {
    if (!tresorerieWithCumulative?.length) return { soldeActuel: 0, entreesPrevues: 0, sortiesPrevues: 0, soldePrevisionnel: 0 };
    const totalEntrees = tresorerieWithCumulative.reduce((s, m) => s + m.entrees, 0);
    const totalSorties = tresorerieWithCumulative.reduce((s, m) => s + m.sorties, 0);
    const dernierSolde = tresorerieWithCumulative[tresorerieWithCumulative.length - 1]?.soldeCumulatif || 0;
    const premierSolde = tresorerieWithCumulative[0]?.solde || 0;
    return { soldeActuel: premierSolde, entreesPrevues: totalEntrees, sortiesPrevues: totalSorties, soldePrevisionnel: dernierSolde };
  }, [tresorerieWithCumulative]);

  // Chart data for projection
  const chartData = useMemo(() => {
    return tresorerieWithCumulative?.map(m => ({
      name: m.moisLabel,
      solde: m.soldeCumulatif,
    })) || [];
  }, [tresorerieWithCumulative]);

  if (tab === "charges") {
    return <Navigate to="/finance/charges-fixes" replace />;
  }

  const months = tresorerieWithCumulative ?? [];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Trésorerie & charges"
          description="Projection des flux de trésorerie et charges fixes"
          icon={Wallet}
          tone="teal"
          meta={
            hasNegativeBalance ? (
              <StatusPill tone="danger" icon={AlertTriangle}>
                Solde prévisionnel négatif
              </StatusPill>
            ) : undefined
          }
          tabs={<TresorerieSubnav activeTab="previsionnel" />}
        />

        {/* KPI Cards */}
        <StatTileGrid cols={4}>
          <StatTile
            label="Solde actuel"
            value={formatPrice(summaryKPIs.soldeActuel)}
            icon={Wallet}
            tone={summaryKPIs.soldeActuel >= 0 ? 'teal' : 'rose'}
            loading={isLoading}
          />
          <StatTile
            label="Entrées prévues"
            value={formatPrice(summaryKPIs.entreesPrevues)}
            icon={ArrowUpRight}
            tone="gold"
            loading={isLoading}
          />
          <StatTile
            label="Sorties prévues"
            value={formatPrice(summaryKPIs.sortiesPrevues)}
            icon={ArrowDownRight}
            tone="navy"
            loading={isLoading}
          />
          <StatTile
            label="Solde prévisionnel"
            value={formatPrice(summaryKPIs.soldePrevisionnel)}
            icon={Scale}
            tone={summaryKPIs.soldePrevisionnel >= 0 ? 'teal' : 'rose'}
            loading={isLoading}
          />
        </StatTileGrid>

        {hasNegativeBalance && (
          <SurfaceCard
            className="border-[hsl(var(--status-critical))]/40"
            bodyClassName="flex items-center gap-3"
          >
            <IconChip icon={AlertTriangle} tone="rose" size="md" />
            <div className="min-w-0">
              <p className="font-medium">Attention: Solde prévisionnel négatif détecté</p>
              <p className="text-sm text-muted-foreground">
                Certains mois présentent un déficit de trésorerie prévu
              </p>
            </div>
          </SurfaceCard>
        )}

        {/* Projection Chart */}
        {chartData.length > 0 && (
          <SurfaceCard
            title="Projection de Trésorerie"
            description="Solde cumulatif mois par mois, sur 6 mois glissants"
            icon={LineChartIcon}
          >
            <TrendChart
              data={chartData}
              xKey="name"
              variant="area"
              height={250}
              series={[{ key: "solde", label: "Solde cumulatif" }]}
              formatValue={(value) => formatPrice(Number(value))}
              formatAxisValue={(value) => `${Math.round(value / 1000)}k`}
              ariaLabel="Projection du solde cumulatif de trésorerie"
            />
          </SurfaceCard>
        )}

        {/* Flux Table */}
        <SurfaceCard
          title="Flux de trésorerie prévisionnels"
          description="Entrées = factures dues · Sorties = charges fixes + formateurs à payer"
          icon={Table2}
          flush
        >
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : months.length === 0 ? (
            <TableEmpty
              title="Aucun flux prévisionnel"
              description="Aucune facture à encaisser ni charge planifiée sur les 6 prochains mois."
              icon={Wallet}
            />
          ) : (
            <>
              <TableFrame className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell className="min-w-[160px]">
                        <span className="sr-only">Poste</span>
                      </TableHeadCell>
                      {months.map((m) => (
                        <TableHeadCell key={m.mois} align="right" className="min-w-[120px]">
                          {m.moisLabel}
                        </TableHeadCell>
                      ))}
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    <TableRow className="bg-[hsl(var(--surface-sunken))]">
                      <TableCell className="font-medium text-[hsl(var(--tint-teal-fg))]">
                        Entrées prévues
                      </TableCell>
                      {months.map((m) => (
                        <TableCell
                          key={m.mois}
                          align="right"
                          className="font-medium tabular text-[hsl(var(--tint-teal-fg))]"
                        >
                          {formatPrice(m.entrees)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        Factures à encaisser
                      </TableCell>
                      {months.map((m) => (
                        <TableCell key={m.mois} align="right" className="text-sm tabular">
                          {formatPrice(m.facturesAEncaisser)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        Formations planifiées
                      </TableCell>
                      {months.map((m) => (
                        <TableCell key={m.mois} align="right" className="text-sm tabular">
                          {formatPrice(m.formationsPlanifiees)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-[hsl(var(--surface-sunken))]">
                      <TableCell className="font-medium text-[hsl(var(--tint-navy-fg))]">
                        Sorties prévues
                      </TableCell>
                      {months.map((m) => (
                        <TableCell
                          key={m.mois}
                          align="right"
                          className="font-medium tabular text-[hsl(var(--tint-navy-fg))]"
                        >
                          {formatPrice(m.sorties)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-sm text-muted-foreground">Charges fixes</TableCell>
                      {months.map((m) => (
                        <TableCell key={m.mois} align="right" className="text-sm tabular">
                          {formatPrice(m.chargesFixes)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        Formateurs à payer
                      </TableCell>
                      {months.map((m) => (
                        <TableCell key={m.mois} align="right" className="text-sm tabular">
                          {formatPrice(m.formateursAPayer)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="border-t-2 border-border">
                      <TableCell className="font-medium">Solde mensuel</TableCell>
                      {months.map((m) => (
                        <TableCell
                          key={m.mois}
                          align="right"
                          className={cn(
                            "font-medium tabular",
                            m.solde >= 0
                              ? "text-[hsl(var(--status-good))]"
                              : "text-[hsl(var(--status-critical))]"
                          )}
                        >
                          {formatPrice(m.solde)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-[hsl(var(--surface-sunken))]">
                      <TableCell className="font-bold">Solde cumulatif</TableCell>
                      {months.map((m) => (
                        <TableCell key={m.mois} align="right">
                          <StatusPill
                            tone={m.soldeCumulatif >= 0 ? "success" : "danger"}
                            className="font-bold tabular"
                          >
                            {formatPrice(m.soldeCumulatif)}
                          </StatusPill>
                        </TableCell>
                      ))}
                    </TableRow>
                  </tbody>
                </table>
              </TableFrame>

              <CardList className="md:hidden">
                {months.map((m) => (
                  <CardListItem
                    key={m.mois}
                    title={m.moisLabel}
                    meta={
                      <StatusPill
                        tone={m.soldeCumulatif >= 0 ? "success" : "danger"}
                        size="sm"
                        className="tabular"
                      >
                        {formatPrice(m.soldeCumulatif)}
                      </StatusPill>
                    }
                    subtitle="Solde cumulatif à droite"
                    fields={[
                      { label: "Entrées prévues", value: formatPrice(m.entrees) },
                      { label: "Factures à encaisser", value: formatPrice(m.facturesAEncaisser) },
                      { label: "Formations planifiées", value: formatPrice(m.formationsPlanifiees) },
                      { label: "Sorties prévues", value: formatPrice(m.sorties) },
                      { label: "Charges fixes", value: formatPrice(m.chargesFixes) },
                      { label: "Formateurs à payer", value: formatPrice(m.formateursAPayer) },
                      { label: "Solde mensuel", value: formatPrice(m.solde) },
                    ]}
                  />
                ))}
              </CardList>
            </>
          )}
        </SurfaceCard>

        <SurfaceCard bodyClassName="flex items-start gap-3">
          <IconChip icon={Info} tone="neutral" size="sm" />
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Ces prévisions sont basées sur les factures en attente,
            les formations planifiées et les modèles de charges fixes. Les montants réels
            peuvent varier en fonction des encaissements et dépenses effectives.
          </p>
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}
