import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceKPICard } from "@/components/finance/FinanceKPICard";
import { CostsByCategory } from "@/components/finance/CostsByCategory";
import { CostForecast } from "@/components/finance/CostForecast";
import { TrendingUp, Receipt, Landmark, CalendarDays, Users, Percent } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Formation {
  id: string | null;
  start_date: string | null;
  ca_ht: number;
  couts_totaux: number;
  marge_pourcent: number;
  marge_brute: number;
  cout_formateur: number;
  cout_hebergement: number;
  cout_deplacement: number;
  cout_salle: number;
  cout_autres: number;
}

interface RentabiliteDashboardProps {
  formations: Formation[] | undefined;
}

export function RentabiliteDashboard({ formations }: RentabiliteDashboardProps) {
  const caTotal = formations?.reduce((s, f) => s + f.ca_ht, 0) || 0;
  const coutsTotal = formations?.reduce((s, f) => s + f.couts_totaux, 0) || 0;
  const margeTotal = caTotal - coutsTotal;
  const margeMoyenne = formations && formations.length > 0
    ? formations.reduce((s, f) => s + f.marge_pourcent, 0) / formations.length
    : 0;

  // Monthly cost data for chart
  const chartData = useMemo(() => {
    if (!formations) return [];
    const byMonth = new Map<string, { costs: number; ca: number }>();
    formations.forEach(f => {
      if (!f.start_date) return;
      const month = f.start_date.substring(0, 7);
      const entry = byMonth.get(month) || { costs: 0, ca: 0 };
      entry.costs += f.couts_totaux;
      entry.ca += f.ca_ht;
      byMonth.set(month, entry);
    });

    const sorted = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));

    // Moving average projection
    const result = sorted.map(([month, data]) => ({
      month: format(new Date(month + '-01'), 'MMM yy', { locale: fr }),
      couts: data.costs,
      ca: data.ca,
      projection: null as number | null,
    }));

    // Add 3 months projection using last 3 months avg
    const last3Costs = sorted.slice(-3).map(([, d]) => d.costs);
    if (last3Costs.length > 0) {
      const avg = last3Costs.reduce((s, v) => s + v, 0) / last3Costs.length;
      const lastMonth = sorted.length > 0 ? new Date(sorted[sorted.length - 1][0] + '-01') : new Date();

      // Set projection on last real point too
      if (result.length > 0) {
        result[result.length - 1].projection = result[result.length - 1].couts;
      }

      for (let i = 1; i <= 3; i++) {
        const d = new Date(lastMonth);
        d.setMonth(d.getMonth() + i);
        result.push({
          month: format(d, 'MMM yy', { locale: fr }),
          couts: 0,
          ca: 0,
          projection: avg,
        });
      }
    }

    return result;
  }, [formations]);

  // Derived KPIs
  const nbFormations = formations?.length || 0;
  const months = new Set(formations?.map(f => f.start_date?.substring(0, 7)).filter(Boolean)).size || 1;
  const depensesMensuelles = coutsTotal / months;
  const coutParEleve = nbFormations > 0 ? coutsTotal / nbFormations : 0;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <FinanceKPICard title="Marge Brute" value={margeTotal} subtitle={`${margeMoyenne.toFixed(1)}% en moyenne`} variant="gold" formatAsPrice icon={TrendingUp} />
        <FinanceKPICard title="Coûts Directs" value={coutsTotal} subtitle="Formateurs + matériel" variant="navy" formatAsPrice icon={Receipt} />
        <FinanceKPICard title="CA Formations" value={caTotal} subtitle={`${nbFormations} formations`} variant="gold" formatAsPrice icon={Landmark} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FinanceKPICard title="Dépenses Mensuelles" value={depensesMensuelles} subtitle="Moyenne sur la période" variant="default" formatAsPrice icon={CalendarDays} />
        <FinanceKPICard title="Coût par Formation" value={coutParEleve} subtitle={`${nbFormations} formations`} variant="default" formatAsPrice icon={Users} />
        <FinanceKPICard title="Marge de Profit" value={`${margeMoyenne.toFixed(1)}%`} subtitle="Moyenne pondérée" variant="gold" icon={Percent} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coûts et Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    formatter={(value: number) => formatPrice(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="couts" name="Coûts réels" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                  <Line type="monotone" dataKey="ca" name="CA" stroke="hsl(var(--fli-yellow))" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                  <Line type="monotone" dataKey="projection" name="Projection" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Costs by Category + Forecast */}
      <div className="grid gap-4 md:grid-cols-2">
        <CostsByCategory formations={formations} />
        <CostForecast formations={formations} />
      </div>
    </div>
  );
}
