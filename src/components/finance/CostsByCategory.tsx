import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Coûts par Catégorie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun coût pour cette période</p>
        )}
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{cat.name}</span>
              <span className="text-muted-foreground">{formatPrice(cat.value)}</span>
            </div>
            <Progress value={(cat.value / maxValue) * 100} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
