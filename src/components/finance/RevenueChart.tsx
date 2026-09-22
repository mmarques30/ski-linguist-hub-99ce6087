import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LineChart as LineChartIcon } from "lucide-react";
import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { SurfaceCard, TrendChart, seriesColor } from "@/components/ui-kit";

const i18n = {
  title: { fr: 'CA et Projections', 'pt-BR': 'Receita e Projeções', en: 'Revenue & Projections' },
  actual: { fr: 'CA Réel', 'pt-BR': 'Receita Real', en: 'Actual Revenue' },
  projection: { fr: 'Projection', 'pt-BR': 'Projeção', en: 'Projection' },
  description: {
    fr: 'Moyenne mobile des 3 derniers mois, projetée sur 3 mois',
    'pt-BR': 'Média móvel dos últimos 3 meses, projetada para 3 meses',
    en: 'Three-month moving average, projected over three months',
  },
};

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
    <SurfaceCard
      title={t(i18n.title)}
      description={t(i18n.description)}
      icon={LineChartIcon}
    >
      <TrendChart
        data={chartData}
        xKey="month"
        variant="line"
        height={300}
        series={[
          { key: "real", label: t(i18n.actual), color: seriesColor(0) },
          { key: "projection", label: t(i18n.projection), color: seriesColor(0), dashed: true },
        ]}
        formatValue={(value) => formatPrice(Number(value))}
        formatAxisValue={(value) => `${Math.round(value / 1000)}k`}
        ariaLabel={t(i18n.title)}
      />
    </SurfaceCard>
  );
}
