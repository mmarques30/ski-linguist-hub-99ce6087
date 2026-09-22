import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarRange } from "lucide-react";
import { SurfaceCard } from "@/components/ui-kit";

const i18n = {
  title: { fr: 'Prévision Trimestrielle', 'pt-BR': 'Previsão Trimestral', en: 'Quarterly Forecast' },
  subtitle: { fr: 'Projection pour Q', 'pt-BR': 'Projeção para Q', en: 'Forecast for Q' },
};

interface QuarterlyForecastProps {
  caByMonth: Array<{ month: string; total: number }> | undefined;
}

export function QuarterlyForecast({ caByMonth }: QuarterlyForecastProps) {
  const { t } = useLanguage();
  const forecast = useMemo(() => {
    if (!caByMonth?.length) return [];
    const lastMonths = caByMonth.slice(-3);
    const avg = lastMonths.reduce((s, m) => s + m.total, 0) / (lastMonths.length || 1);
    const lastMonth = new Date(caByMonth[caByMonth.length - 1].month + '-01');

    return [1, 2, 3].map(i => {
      const d = addMonths(lastMonth, i);
      return {
        label: format(d, 'MMMM yyyy', { locale: fr }),
        value: Math.round(avg),
      };
    });
  }, [caByMonth]);

  const total = forecast.reduce((s, f) => s + f.value, 0);
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 2) / 3); // next quarter approx

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <SurfaceCard
      className="h-full"
      title={t(i18n.title)}
      description={`${t(i18n.subtitle)}${quarter} ${now.getFullYear()}`}
      icon={CalendarRange}
      footer={
        forecast.length > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-bold tabular text-[hsl(var(--tint-gold-fg))]">
              {formatPrice(total)}
            </span>
          </div>
        ) : undefined
      }
    >
      {forecast.length > 0 ? (
        <dl className="space-y-3">
          {forecast.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <dt className="text-sm capitalize text-muted-foreground">{f.label}</dt>
              <dd className="text-sm font-semibold tabular">{formatPrice(f.value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">Données insuffisantes</p>
      )}
    </SurfaceCard>
  );
}
