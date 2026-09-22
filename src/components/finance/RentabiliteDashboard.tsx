import { useMemo } from "react";
import { CostsByCategory } from "@/components/finance/CostsByCategory";
import { CostForecast } from "@/components/finance/CostForecast";
import {
  TrendingUp,
  Receipt,
  Landmark,
  CalendarDays,
  Users,
  Percent,
  LineChart as LineChartIcon,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  StatTile,
  StatTileGrid,
  SurfaceCard,
  TrendChart,
  seriesColor,
} from "@/components/ui-kit";

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
    <div className="space-y-4 lg:space-y-5">
      {/* KPI Grid */}
      <StatTileGrid cols={3}>
        <StatTile
          label="Marge Brute"
          value={formatPrice(margeTotal)}
          hint={`${margeMoyenne.toFixed(1)}% en moyenne`}
          icon={TrendingUp}
          tone="gold"
        />
        <StatTile
          label="Coûts Directs"
          value={formatPrice(coutsTotal)}
          hint="Formateurs + matériel"
          icon={Receipt}
          tone="navy"
        />
        <StatTile
          label="CA Formations"
          value={formatPrice(caTotal)}
          hint={`${nbFormations} formations`}
          icon={Landmark}
          tone="teal"
        />
      </StatTileGrid>
      <StatTileGrid cols={3}>
        <StatTile
          label="Dépenses Mensuelles"
          value={formatPrice(depensesMensuelles)}
          hint="Moyenne sur la période"
          icon={CalendarDays}
          tone="neutral"
        />
        <StatTile
          label="Coût par Formation"
          value={formatPrice(coutParEleve)}
          hint={`${nbFormations} formations`}
          icon={Users}
          tone="neutral"
        />
        <StatTile
          label="Marge de Profit"
          value={`${margeMoyenne.toFixed(1)}%`}
          hint="Moyenne pondérée"
          icon={Percent}
          tone="gold"
        />
      </StatTileGrid>

      {/* Chart */}
      {chartData.length > 0 && (
        <SurfaceCard
          title="Coûts et Projections"
          description="Coûts réels et CA par mois, prolongés par la moyenne mobile des 3 derniers mois"
          icon={LineChartIcon}
        >
          <TrendChart
            data={chartData}
            xKey="month"
            variant="line"
            height={300}
            series={[
              { key: "couts", label: "Coûts réels", color: seriesColor(0) },
              { key: "ca", label: "CA", color: seriesColor(1) },
              { key: "projection", label: "Projection", color: seriesColor(0), dashed: true },
            ]}
            formatValue={(value) => formatPrice(Number(value))}
            formatAxisValue={(value) => `${Math.round(value / 1000)}k`}
            ariaLabel="Coûts réels, CA et projection des coûts"
          />
        </SurfaceCard>
      )}

      {/* Costs by Category + Forecast */}
      <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
        <CostsByCategory formations={formations} />
        <CostForecast formations={formations} />
      </div>
    </div>
  );
}
