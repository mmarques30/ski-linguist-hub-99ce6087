import { useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FinanceKPICard } from "@/components/finance/FinanceKPICard";
import { useTresoreriePrevisionnelle } from "@/hooks/useFinancialDashboard";
import { AlertTriangle, Wallet, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

const BRAND_GOLD = 'hsl(40, 97%, 54%)';
const BRAND_NAVY = 'hsl(219, 52%, 16%)';

export default function FinanceTresorerie() {
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trésorerie Prévisionnelle</h1>
          <p className="text-muted-foreground">
            Projection des flux de trésorerie sur les 6 prochains mois
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <FinanceKPICard
            title="Solde actuel"
            value={summaryKPIs.soldeActuel}
            variant={summaryKPIs.soldeActuel >= 0 ? 'gold' : 'navy'}
            formatAsPrice
            icon={Wallet}
          />
          <FinanceKPICard
            title="Entrées prévues"
            value={summaryKPIs.entreesPrevues}
            variant="gold"
            formatAsPrice
            icon={ArrowUpRight}
          />
          <FinanceKPICard
            title="Sorties prévues"
            value={summaryKPIs.sortiesPrevues}
            variant="navy"
            formatAsPrice
            icon={ArrowDownRight}
          />
          <FinanceKPICard
            title="Solde prévisionnel"
            value={summaryKPIs.soldePrevisionnel}
            variant={summaryKPIs.soldePrevisionnel >= 0 ? 'gold' : 'navy'}
            formatAsPrice
            icon={Scale}
          />
        </div>

        {hasNegativeBalance && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Attention: Solde prévisionnel négatif détecté</p>
                <p className="text-sm text-muted-foreground">
                  Certains mois présentent un déficit de trésorerie prévu
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projection Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projection de Trésorerie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number) => [formatPrice(value), 'Solde cumulatif']}
                    />
                    <defs>
                      <linearGradient id="soldeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND_GOLD} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={BRAND_GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="solde" stroke={BRAND_GOLD} strokeWidth={2} fill="url(#soldeGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flux Table */}
        <Card>
          <CardHeader>
            <CardTitle>Flux de trésorerie prévisionnels</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]"></TableHead>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableHead key={m.mois} className="text-center min-w-[120px]">
                          {m.moisLabel}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-[hsl(var(--fli-yellow))]/5">
                      <TableCell className="font-medium text-[hsl(var(--fli-yellow))]">Entrées prévues</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center font-medium text-[hsl(var(--fli-yellow))]">
                          {formatPrice(m.entrees)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">Factures à encaisser</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.facturesAEncaisser)}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">Formations planifiées</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.formationsPlanifiees)}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-[hsl(var(--fli-navy))]/5">
                      <TableCell className="font-medium text-[hsl(var(--fli-navy))]">Sorties prévues</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center font-medium text-[hsl(var(--fli-navy))]">
                          {formatPrice(m.sorties)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">Charges fixes</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.chargesFixes)}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">Formateurs à payer</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.formateursAPayer)}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="font-medium">Solde mensuel</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className={cn("text-center font-medium", m.solde >= 0 ? "text-[hsl(var(--fli-yellow))]" : "text-destructive")}>
                          {formatPrice(m.solde)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Solde cumulatif</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center">
                          <Badge
                            variant={m.soldeCumulatif >= 0 ? "default" : "destructive"}
                            className={cn("text-sm font-bold", m.soldeCumulatif >= 0 ? "bg-[hsl(var(--fli-yellow))]/15 text-[hsl(var(--fli-yellow))] border-[hsl(var(--fli-yellow))]/30" : "")}
                          >
                            {formatPrice(m.soldeCumulatif)}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Ces prévisions sont basées sur les factures en attente, 
              les formations planifiées et les modèles de charges fixes. Les montants réels 
              peuvent varier en fonction des encaissements et dépenses effectives.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
