import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Prévision de Coûts</CardTitle>
          <Badge className="bg-[hsl(var(--fli-yellow))]/15 text-[hsl(var(--fli-yellow))] border-[hsl(var(--fli-yellow))]/30">
            <TrendingUp className="h-3 w-3 mr-1" />
            Projection
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {projectedMonths.map((m) => (
          <div key={m.label} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
            <span className="capitalize font-medium">{m.label}</span>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{formatPrice(m.costs)}</span>
              <span className={m.profit >= 0 ? "text-[hsl(var(--fli-yellow))] font-medium" : "text-destructive font-medium"}>
                {formatPrice(m.profit)}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-semibold text-sm">Profit projeté (trimestre)</span>
          <span className={`font-bold ${totalProfit >= 0 ? "text-[hsl(var(--fli-yellow))]" : "text-destructive"}`}>
            {formatPrice(totalProfit)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
