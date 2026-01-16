import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTresoreriePrevisionnelle } from "@/hooks/useFinancialDashboard";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
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

  // Calculate cumulative balance
  let cumulativeBalance = 0;
  const tresorerieWithCumulative = tresorerie?.map((m, idx) => {
    cumulativeBalance += m.solde;
    return { ...m, soldeCumulatif: cumulativeBalance };
  });

  const hasNegativeBalance = tresorerieWithCumulative?.some(m => m.soldeCumulatif < 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Trésorerie Prévisionnelle</h1>
          <p className="text-muted-foreground">
            Projection des flux de trésorerie sur les 6 prochains mois
          </p>
        </div>

        {/* Alert if negative balance */}
        {hasNegativeBalance && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Attention: Solde prévisionnel négatif détecté
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Certains mois présentent un déficit de trésorerie prévu
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tresorerie Table */}
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
                    <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                      <TableCell className="font-medium text-emerald-700 dark:text-emerald-400">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Entrées prévues
                        </div>
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center font-medium text-emerald-600">
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
                    <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                      <TableCell className="font-medium text-red-700 dark:text-red-400">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Sorties prévues
                        </div>
                      </TableCell>
                      {tresorerieWithCumulative?.map((m) => (
                        <TableCell key={m.mois} className="text-center font-medium text-red-600">
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
                            m.solde >= 0 ? "text-emerald-600" : "text-red-600"
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
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
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

        {/* Notes */}
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
