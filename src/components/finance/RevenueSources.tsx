import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, GraduationCap, Handshake, PieChart } from "lucide-react";
import { IconChip, RankedBarList, SurfaceCard } from "@/components/ui-kit";
import type { TileTone } from "@/components/ui-kit";

const i18n = {
  title: { fr: 'Sources de revenus', 'pt-BR': 'Fontes de Receita', en: 'Revenue Sources' },
  subtitle: { fr: 'Distribution par type de cours', 'pt-BR': 'Distribuição por tipo de curso', en: 'Distribution by course type' },
};

interface RevenueSourcesProps {
  caByType: Array<{ name: string; value: number; type: string }> | undefined;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  formation: BookOpen,
  test: GraduationCap,
  soustraitance: Handshake,
};

const typeTones: Record<string, TileTone> = {
  formation: "gold",
  test: "blue",
  soustraitance: "teal",
};

export function RevenueSources({ caByType }: RevenueSourcesProps) {
  const { t } = useLanguage();
  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const total = caByType?.reduce((s, i) => s + i.value, 0) || 0;

  const items = (caByType ?? []).map((item) => {
    const Icon = typeIcons[item.type] || BookOpen;
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
    return {
      key: item.type,
      label: (
        <span className="flex min-w-0 items-center gap-2">
          <IconChip icon={Icon} tone={typeTones[item.type] ?? "neutral"} size="sm" />
          <span className="truncate font-medium">{item.name}</span>
        </span>
      ),
      value: item.value,
      display: formatPrice(item.value),
      hint: `${pct}% du total`,
    };
  });

  return (
    <SurfaceCard
      className="h-full"
      title={t(i18n.title)}
      description={t(i18n.subtitle)}
      icon={PieChart}
    >
      <RankedBarList items={items} colorBySeries emptyMessage="Aucune donnée" />
    </SurfaceCard>
  );
}
