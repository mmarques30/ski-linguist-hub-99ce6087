import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";

interface CostForecastProps {
  formations: Array<{
    start_date: string | null;
    couts_totaux: number;
    ca_ht: number;
  }> | undefined;
}

export function CostForecast({ formations }: CostForecastProps) {
  // Group costs by month
  const byMonth = new Map<string, { costs: number; ca: number }>();
  formations?.forEach(f => {
    if (!f.start_date) return;
    const month = f.start_date.substring(0, 7);
    const entry = byMonth.get(month) || { costs: 0, ca: 0 };
    entry.costs += f.couts_totaux;
    entry.ca += f.ca_ht;
    byMonth.set(month, entry);
  });

  const sortedMonths = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
  const last3 = sortedMonths.slice(-3);

  // Moving average
  const avgCost = last3.length > 0 ? last3.reduce((s, [, v]) => s + v.costs, 0) / last3.length : 0;
  const avgCA = last3.length > 0 ? last3.reduce((s, [, v]) => s + v.ca, 0) / last3.length : 0;

  const now = new Date();
  const projectedMonths = [1, 2, 3].map(i => {
    const d = addMonths(now, i);
    return {
      label: format(d, 'MMM yyyy', { locale: fr }),
      costs: avgCost,
      ca: avgCA,
      profit: avgCA - avgCost,
    };
  });

  const totalProfit = projectedMonths.reduce((s, m) => s + m.profit, 0);

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  return (
    <SurfaceCard
      title="Prévision de Coûts"
      description="Moyenne mobile des 3 derniers mois, projetée sur le trimestre"
      icon={TrendingUp}
      actions={
        <StatusPill tone="warning" icon={TrendingUp}>
          Projection
        </StatusPill>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Profit projeté (trimestre)</span>
          <span
            className={cn(
              "font-bold tabular",
              totalProfit >= 0
                ? "text-[hsl(var(--status-good))]"
                : "text-[hsl(var(--status-critical))]"
            )}
          >
            {formatPrice(totalProfit)}
          </span>
        </div>
      }
    >
      <ul className="space-y-3">
        {projectedMonths.map((m) => (
          <li
            key={m.label}
            className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0 last:pb-0"
          >
            <span className="font-medium capitalize">{m.label}</span>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground tabular">{formatPrice(m.costs)}</span>
              <span
                className={cn(
                  "font-medium tabular",
                  m.profit >= 0
                    ? "text-[hsl(var(--status-good))]"
                    : "text-[hsl(var(--status-critical))]"
                )}
              >
                {formatPrice(m.profit)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}
