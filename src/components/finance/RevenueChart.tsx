import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

const BRAND_GOLD = "hsl(45, 93%, 47%)";
const BRAND_NAVY = "hsl(213, 50%, 20%)";

interface RevenueChartProps {
  caByMonth: Array<{ month: string; total: number; totalN1: number }> | undefined;
}

export function RevenueChart({ caByMonth }: RevenueChartProps) {
  const { t } = useLanguage();
  const chartData = useMemo(() => {
    if (!caByMonth?.length) return [];

    const realData = caByMonth.map(m => ({
      month: format(new Date(m.month + '-01'), 'MMM yy', { locale: fr }),
      real: m.total,
      projection: null as number | null,
    }));

    // Moving average of last 3 months for projection
    const lastMonths = caByMonth.slice(-3);
    const avg = lastMonths.reduce((s, m) => s + m.total, 0) / (lastMonths.length || 1);

    // Add 3 projected months
    const lastMonth = new Date(caByMonth[caByMonth.length - 1].month + '-01');
    for (let i = 1; i <= 3; i++) {
      const projected = addMonths(lastMonth, i);
      realData.push({
        month: format(projected, 'MMM yy', { locale: fr }),
        real: null as unknown as number,
        projection: Math.round(avg),
      });
    }

    // Set projection start point to match last real value
    if (realData.length > 3) {
      const lastRealIdx = realData.length - 4;
      realData[lastRealIdx].projection = realData[lastRealIdx].real;
    }

    return realData;
  }, [caByMonth]);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita e Projeções</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip formatter={(value: number) => formatPrice(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="real"
                name="Receita Real"
                stroke={BRAND_GOLD}
                strokeWidth={2}
                dot={{ fill: BRAND_GOLD, r: 4 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projection"
                name="Projeção"
                stroke={BRAND_NAVY}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
