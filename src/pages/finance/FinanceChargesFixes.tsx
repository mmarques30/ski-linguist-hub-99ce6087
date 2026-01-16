import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useCostTemplates, 
  useFixedCosts, 
  useUpdateCostTemplate, 
  useGenerateMonthlyCharges,
  useUpdateFixedCost,
} from "@/hooks/useFinancialDashboard";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

const costTypeLabels: Record<string, string> = {
  loyer: 'Loyer',
  telecom: 'Télécom',
  assurance: 'Assurance',
  comptable: 'Comptable',
  banque: 'Frais bancaires',
  logiciels: 'Logiciels',
  maintenance: 'Maintenance',
  qualiopi: 'Qualiopi',
  emprunt: 'Emprunt',
  autre: 'Autre',
};

export default function FinanceChargesFixes() {
  const { toast } = useToast();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>('');

  const { data: templates } = useCostTemplates();
  const { data: fixedCosts } = useFixedCosts(selectedMonth);
  const updateTemplate = useUpdateCostTemplate();
  const generateCharges = useGenerateMonthlyCharges();
  const updateFixedCost = useUpdateFixedCost();

  // Generate list of months for selection
  const months = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    d.setDate(1);
    months.push({
      value: format(d, 'yyyy-MM-dd'),
      label: format(d, 'MMMM yyyy', { locale: fr }),
    });
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleToggleTemplate = async (id: string, currentActive: boolean) => {
    try {
      await updateTemplate.mutateAsync({ id, actif: !currentActive });
      toast({ title: "Modèle mis à jour" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleSaveTemplateAmount = async (id: string) => {
    try {
      await updateTemplate.mutateAsync({ id, montant_mensuel: Number(editedAmount) });
      setEditingTemplate(null);
      toast({ title: "Montant mis à jour" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleGenerateCharges = async () => {
    try {
      await generateCharges.mutateAsync(selectedMonth);
      toast({ title: "Charges générées", description: `Charges du mois générées avec succès` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleTogglePaid = async (id: string, currentPaid: boolean) => {
    try {
      await updateFixedCost.mutateAsync({ 
        id, 
        paye: !currentPaid,
        date_paiement: !currentPaid ? format(new Date(), 'yyyy-MM-dd') : null,
      });
      toast({ title: currentPaid ? "Marqué comme non payé" : "Marqué comme payé" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const totalTemplates = templates?.filter(t => t.actif).reduce((sum, t) => sum + Number(t.montant_mensuel), 0) || 0;
  const totalCharges = fixedCosts?.reduce((sum, c) => sum + Number(c.montant), 0) || 0;
  const totalPaid = fixedCosts?.filter(c => c.paye).reduce((sum, c) => sum + Number(c.montant), 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Charges Fixes</h1>
          <p className="text-muted-foreground">
            Gestion des charges récurrentes mensuelles
          </p>
        </div>

        <Tabs defaultValue="month" className="space-y-4">
          <TabsList>
            <TabsTrigger value="month">Charges du mois</TabsTrigger>
            <TabsTrigger value="templates">Modèles récurrents</TabsTrigger>
          </TabsList>

          <TabsContent value="month" className="space-y-4">
            {/* Month Selector and Generate */}
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Button onClick={handleGenerateCharges} disabled={generateCharges.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generateCharges.isPending ? 'animate-spin' : ''}`} />
                Générer les charges
              </Button>
            </div>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total charges</p>
                <p className="text-xl font-bold">{formatPrice(totalCharges)}</p>
              </Card>
              <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/30">
                <p className="text-sm text-muted-foreground">Payé</p>
                <p className="text-xl font-bold text-emerald-600">{formatPrice(totalPaid)}</p>
              </Card>
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/30">
                <p className="text-sm text-muted-foreground">À payer</p>
                <p className="text-xl font-bold text-amber-600">{formatPrice(totalCharges - totalPaid)}</p>
              </Card>
            </div>

            {/* Charges Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Charges de {format(new Date(selectedMonth), 'MMMM yyyy', { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fixedCosts?.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">
                          {costTypeLabels[cost.cost_type] || cost.cost_type}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cost.description}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(Number(cost.montant))}
                        </TableCell>
                        <TableCell className="text-center">
                          {cost.paye ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Payé
                            </Badge>
                          ) : (
                            <Badge variant="secondary">À payer</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePaid(cost.id, cost.paye)}
                          >
                            {cost.paye ? 'Annuler' : 'Marquer payé'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!fixedCosts || fixedCosts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucune charge pour ce mois. Cliquez sur "Générer les charges" pour créer les charges à partir des modèles.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            {/* Templates Summary */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total mensuel (modèles actifs)</p>
                  <p className="text-2xl font-bold">{formatPrice(totalTemplates)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {templates?.filter(t => t.actif).length} / {templates?.length} modèles actifs
                </p>
              </div>
            </Card>

            {/* Templates Table */}
            <Card>
              <CardHeader>
                <CardTitle>Modèles de charges récurrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant mensuel</TableHead>
                      <TableHead className="text-center">Actif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates?.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {costTypeLabels[template.cost_type] || template.cost_type}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {template.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingTemplate === template.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={editedAmount}
                                onChange={(e) => setEditedAmount(e.target.value)}
                                className="w-24 text-right"
                              />
                              <Button size="sm" onClick={() => handleSaveTemplateAmount(template.id)}>
                                OK
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(null)}>
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              className="font-medium"
                              onClick={() => {
                                setEditingTemplate(template.id);
                                setEditedAmount(template.montant_mensuel.toString());
                              }}
                            >
                              {formatPrice(Number(template.montant_mensuel))}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={template.actif}
                            onCheckedChange={() => handleToggleTemplate(template.id, template.actif)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
