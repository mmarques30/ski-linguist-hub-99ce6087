import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

const i18n = {
  title: { fr: 'Prévision Trimestrielle', 'pt-BR': 'Previsão Trimestral', en: 'Quarterly Forecast' },
  subtitle: { fr: 'Projection pour Q', 'pt-BR': 'Projeção para Q', en: 'Forecast for Q' },
};

interface QuarterlyForecastProps {
  caByMonth: Array<{ month: string; total: number }> | undefined;
}

export function QuarterlyForecast({ caByMonth }: QuarterlyForecastProps) {
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Previsão Trimestral</CardTitle>
        <p className="text-sm text-muted-foreground">
          Projection pour Q{quarter} {now.getFullYear()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {forecast.map((f, i) => (
            <div key={i} className="flex items-center justify-between">
              <p className="text-sm capitalize">{f.label}</p>
              <p className="text-sm font-semibold">{formatPrice(f.value)}</p>
            </div>
          ))}
          {forecast.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Total</p>
                <p className="text-sm font-bold text-[hsl(var(--fli-yellow))]">{formatPrice(total)}</p>
              </div>
            </>
          )}
          {forecast.length === 0 && (
            <p className="text-sm text-muted-foreground">Données insuffisantes</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
