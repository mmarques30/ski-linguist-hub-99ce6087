import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { FinanceKPICard } from "@/components/finance/FinanceKPICard";
import { AddCostDialog } from "@/components/finance/AddCostDialog";
import { useFormationProfitability } from "@/hooks/useFinancialDashboard";
import { Plus, ChevronDown, ChevronRight, TrendingUp, Receipt, Landmark } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export default function FinanceRentabilite() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(subMonths(startOfMonth(today), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState<string | undefined>();

  const { data: formations } = useFormationProfitability(startDate, endDate);

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleAddCost = (inscriptionId: string) => {
    setSelectedInscription(inscriptionId);
    setAddCostOpen(true);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMargeColor = (percent: number) => {
    if (percent >= 50) return 'text-[hsl(var(--fli-yellow))]';
    if (percent >= 30) return 'text-foreground';
    return 'text-destructive';
  };

  const getMargeBadge = (percent: number) => {
    if (percent >= 50) return <Badge className="bg-[hsl(var(--fli-yellow))]/15 text-[hsl(var(--fli-yellow))] border-[hsl(var(--fli-yellow))]/30">Excellent</Badge>;
    if (percent >= 30) return <Badge variant="secondary">Correct</Badge>;
    return <Badge variant="destructive">Faible</Badge>;
  };

  // Summary calculations
  const caTotal = formations?.reduce((sum, f) => sum + f.ca_ht, 0) || 0;
  const coutsTotal = formations?.reduce((sum, f) => sum + f.couts_totaux, 0) || 0;
  const margeTotal = caTotal - coutsTotal;
  const margeMoyenne = formations && formations.length > 0
    ? formations.reduce((sum, f) => sum + f.marge_pourcent, 0) / formations.length
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rentabilité des Formations</h1>
            <p className="text-muted-foreground">
              Analyse de la marge par formation
            </p>
          </div>
          <Button onClick={() => { setSelectedInscription(undefined); setAddCostOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un coût
          </Button>
        </div>

        <PeriodSelector
          startDate={startDate}
          endDate={endDate}
          onPeriodChange={handlePeriodChange}
        />

        {/* Summary KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <FinanceKPICard
            title="Marge brute"
            value={margeTotal}
            subtitle={`${margeMoyenne.toFixed(1)}% en moyenne`}
            variant="gold"
            formatAsPrice
            icon={TrendingUp}
          />
          <FinanceKPICard
            title="Coûts directs"
            value={coutsTotal}
            subtitle={`${formations?.length || 0} formations`}
            variant="navy"
            formatAsPrice
            icon={Receipt}
          />
          <FinanceKPICard
            title="CA Total"
            value={caTotal}
            variant="gold"
            formatAsPrice
            icon={Landmark}
          />
        </div>

        {/* Formations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Détail par formation</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">CA HT</TableHead>
                  <TableHead className="text-right">Coûts</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formations?.map((formation) => (
                  <Collapsible key={formation.id} asChild open={expandedRows.has(formation.id!)}>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(formation.id!)}>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {expandedRows.has(formation.id!) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formation.code || 'Sans code'}</p>
                            <p className="text-sm text-muted-foreground">{formation.student_name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formation.start_date && format(new Date(formation.start_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatPrice(formation.ca_ht)}</TableCell>
                        <TableCell className="text-right">{formatPrice(formation.couts_totaux)}</TableCell>
                        <TableCell className={cn("text-right font-medium", getMargeColor(formation.marge_pourcent))}>
                          {formatPrice(formation.marge_brute)}
                        </TableCell>
                        <TableCell className="text-right">
                          {getMargeBadge(formation.marge_pourcent)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleAddCost(formation.id!); }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell colSpan={7}>
                            <div className="py-2 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Formateur</p>
                                <p className="font-medium">{formatPrice(formation.cout_formateur)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Hébergement</p>
                                <p className="font-medium">{formatPrice(formation.cout_hebergement)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Déplacement</p>
                                <p className="font-medium">{formatPrice(formation.cout_deplacement)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Salle</p>
                                <p className="font-medium">{formatPrice(formation.cout_salle)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Autres</p>
                                <p className="font-medium">{formatPrice(formation.cout_autres)}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
                {(!formations || formations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucune formation avec données financières pour cette période
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddCostDialog 
        open={addCostOpen} 
        onOpenChange={setAddCostOpen}
        inscriptionId={selectedInscription}
      />
    </MainLayout>
  );
}
