import { Layers } from "lucide-react";
import { RankedBarList, SurfaceCard } from "@/components/ui-kit";

interface CostCategory {
  name: string;
  value: number;
}

interface CostsByCategoryProps {
  formations: Array<{
    cout_formateur: number;
    cout_hebergement: number;
    cout_deplacement: number;
    cout_salle: number;
    cout_autres: number;
  }> | undefined;
}

export function CostsByCategory({ formations }: CostsByCategoryProps) {
  const categories: CostCategory[] = [
    { name: "Formateur", value: formations?.reduce((s, f) => s + f.cout_formateur, 0) || 0 },
    { name: "Hébergement", value: formations?.reduce((s, f) => s + f.cout_hebergement, 0) || 0 },
    { name: "Déplacement", value: formations?.reduce((s, f) => s + f.cout_deplacement, 0) || 0 },
    { name: "Salle", value: formations?.reduce((s, f) => s + f.cout_salle, 0) || 0 },
    { name: "Autres", value: formations?.reduce((s, f) => s + f.cout_autres, 0) || 0 },
  ].filter(c => c.value > 0);

  const maxValue = Math.max(...categories.map(c => c.value), 1);

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  return (
    <SurfaceCard
      title="Coûts par Catégorie"
      description="Coûts directs cumulés sur la période"
      icon={Layers}
    >
      <RankedBarList
        items={categories.map((cat) => ({
          key: cat.name,
          label: cat.name,
          value: cat.value,
          display: formatPrice(cat.value),
        }))}
        max={maxValue}
        emptyMessage="Aucun coût pour cette période"
      />
    </SurfaceCard>
  );
}
