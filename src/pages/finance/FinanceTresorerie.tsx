import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTresoreriePrevisionnelle } from "@/hooks/useFinancialDashboard";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinanceTresorerie() {
  const { data: tresorerie, isLoading } = useTresoreriePrevisionnelle(6);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  let cumulativeBalance = 0;
  const tresorerieWithCumulative = tresorerie?.map((m) => {
    cumulativeBalance += m.solde;
    return { ...m, soldeCumulatif: cumulativeBalance };
  });

  const hasNegativeBalance = tresorerieWithCumulative?.some(m => m.soldeCumulatif < 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trésorerie Prévisionnelle</h1>
          <p className="text-muted-foreground">
            Projection des flux de trésorerie sur les 6 prochains mois
          </p>
        </div>

        {hasNegativeBalance && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">
                  Attention: Solde prévisionnel négatif détecté
                </p>
                <p className="text-sm text-muted-foreground">
                  Certains mois présentent un déficit de trésorerie prévu
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Flux de trésorerie prévisionnels</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]"></TableHead>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableHead key={m.mois} className="text-center min-w-[120px]">
                          {m.moisLabel}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Entrées */}
                    <TableRow className="bg-[hsl(var(--fli-yellow))]/5">
                      <TableCell className="font-medium text-[hsl(var(--fli-yellow))]">
                        Entrées prévues
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center font-medium text-[hsl(var(--fli-yellow))]">
                          {formatPrice(m.entrees)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">
                        Factures à encaisser
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">
                          {formatPrice(m.facturesAEncaisser)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">
                        Formations planifiées
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">
                          {formatPrice(m.formationsPlanifiees)}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Sorties */}
                    <TableRow className="bg-[hsl(var(--fli-navy))]/5">
                      <TableCell className="font-medium text-[hsl(var(--fli-navy))]">
                        Sorties prévues
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center font-medium text-[hsl(var(--fli-navy))]">
                          {formatPrice(m.sorties)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">
                        Charges fixes
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">
                          {formatPrice(m.chargesFixes)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground pl-8">
                        Formateurs à payer
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center text-sm">
                          {formatPrice(m.formateursAPayer)}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Solde mensuel */}
                    <TableRow className="border-t-2">
                      <TableCell className="font-medium">Solde mensuel</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell 
                          key={m.mois} 
                          className={cn(
                            "text-center font-medium",
                            m.solde >= 0 ? "text-[hsl(var(--fli-yellow))]" : "text-destructive"
                          )}
                        >
                          {formatPrice(m.solde)}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Solde cumulatif */}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Solde cumulatif</TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center">
                          <Badge 
                            variant={m.soldeCumulatif >= 0 ? "default" : "destructive"}
                            className={cn(
                              "text-sm font-bold",
                              m.soldeCumulatif >= 0 
                                ? "bg-[hsl(var(--fli-yellow))]/15 text-[hsl(var(--fli-yellow))] border-[hsl(var(--fli-yellow))]/30"
                                : ""
                            )}
                          >
                            {formatPrice(m.soldeCumulatif)}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Ces prévisions sont basées sur les factures en attente, 
              les formations planifiées et les modèles de charges fixes. Les montants réels 
              peuvent varier en fonction des encaissements et dépenses effectives.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
