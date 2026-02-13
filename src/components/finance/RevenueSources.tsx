import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Handshake } from "lucide-react";

interface RevenueSourcesProps {
  caByType: Array<{ name: string; value: number; type: string }> | undefined;
}

const typeIcons: Record<string, React.ElementType> = {
  formation: BookOpen,
  test: GraduationCap,
  soustraitance: Handshake,
};

export function RevenueSources({ caByType }: RevenueSourcesProps) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const total = caByType?.reduce((s, i) => s + i.value, 0) || 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Fontes de Receita</CardTitle>
        <p className="text-sm text-muted-foreground">Distribution par type de cours</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {caByType?.map((item) => {
            const Icon = typeIcons[item.type] || BookOpen;
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
            return (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--fli-yellow))]/10">
                    <Icon className="h-4 w-4 text-[hsl(var(--fli-yellow))]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{pct}% du total</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.value)}</p>
              </div>
            );
          })}
          {(!caByType || caByType.length === 0) && (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
