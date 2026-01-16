import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  useCostTemplates, 
  useFixedCosts, 
  useUpdateCostTemplate, 
  useGenerateMonthlyCharges,
  useUpdateFixedCost,
} from "@/hooks/useFinancialDashboard";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, AlertCircle, TrendingUp, Wallet, Clock, PieChart } from "lucide-react";
import { format, startOfMonth, subMonths, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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
  const { data: allFixedCosts } = useFixedCosts(); // All costs for dashboard
  const updateTemplate = useUpdateCostTemplate();
  const generateCharges = useGenerateMonthlyCharges();
  const updateFixedCost = useUpdateFixedCost();

  // Calculate unpaid costs across all months
  const unpaidStats = useMemo(() => {
    if (!allFixedCosts) return { total: 0, count: 0, byType: [], overdue: [] };
    
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    
    const unpaid = allFixedCosts.filter(c => !c.paye);
    const total = unpaid.reduce((sum, c) => sum + Number(c.montant), 0);
    
    // Group by type
    const byTypeMap = new Map<string, number>();
    unpaid.forEach(c => {
      const current = byTypeMap.get(c.cost_type) || 0;
      byTypeMap.set(c.cost_type, current + Number(c.montant));
    });
    const byType = Array.from(byTypeMap.entries()).map(([name, value]) => ({
      name: costTypeLabels[name] || name,
      value,
    }));
    
    // Overdue = unpaid and month is before current month
    const overdue = unpaid.filter(c => {
      const costMonth = new Date(c.mois);
      return isBefore(costMonth, currentMonthStart);
    });
    
    return { total, count: unpaid.length, byType, overdue };
  }, [allFixedCosts]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    if (!allFixedCosts) return [];
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStr = format(startOfMonth(date), 'yyyy-MM-dd');
      const monthCosts = allFixedCosts.filter(c => c.mois === monthStr);
      const total = monthCosts.reduce((sum, c) => sum + Number(c.montant), 0);
      const paid = monthCosts.filter(c => c.paye).reduce((sum, c) => sum + Number(c.montant), 0);
      
      last6Months.push({
        month: format(date, 'MMM', { locale: fr }),
        total,
        paid,
        unpaid: total - paid,
      });
    }
    return last6Months;
  }, [allFixedCosts]);

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
  const paymentProgress = totalCharges > 0 ? (totalPaid / totalCharges) * 100 : 0;

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="month">Charges du mois</TabsTrigger>
            <TabsTrigger value="templates">Modèles récurrents</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4 border-l-4 border-l-destructive">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total impayé</p>
                    <p className="text-2xl font-bold text-destructive">{formatPrice(unpaidStats.total)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{unpaidStats.count} charge(s)</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded-full">
                    <Wallet className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </Card>
              
              <Card className={`p-4 border-l-4 ${unpaidStats.overdue.length > 0 ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En retard</p>
                    <p className={`text-2xl font-bold ${unpaidStats.overdue.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {unpaidStats.overdue.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPrice(unpaidStats.overdue.reduce((s, c) => s + Number(c.montant), 0))}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${unpaidStats.overdue.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    <Clock className={`h-5 w-5 ${unpaidStats.overdue.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-l-primary">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ce mois</p>
                    <p className="text-2xl font-bold">{formatPrice(totalCharges)}</p>
                    <div className="mt-2">
                      <Progress value={paymentProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{Math.round(paymentProgress)}% payé</p>
                    </div>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-l-4 border-l-muted-foreground">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mensuel prévu</p>
                    <p className="text-2xl font-bold">{formatPrice(totalTemplates)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {templates?.filter(t => t.actif).length} modèles actifs
                    </p>
                  </div>
                  <div className="p-2 bg-muted rounded-full">
                    <PieChart className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Unpaid by Type Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition des impayés</CardTitle>
                </CardHeader>
                <CardContent>
                  {unpaidStats.byType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie
                          data={unpaidStats.byType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {unpaidStats.byType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatPrice(value)}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                      <CheckCircle className="h-12 w-12 text-emerald-500 mb-2" />
                      <p>Toutes les charges sont payées !</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overdue List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Charges en retard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {unpaidStats.overdue.length > 0 ? (
                    <div className="space-y-3 max-h-[250px] overflow-auto">
                      {unpaidStats.overdue.map((cost) => (
                        <div key={cost.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div>
                            <p className="font-medium">{costTypeLabels[cost.cost_type] || cost.cost_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(cost.mois), 'MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-600">{formatPrice(Number(cost.montant))}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs"
                              onClick={() => handleTogglePaid(cost.id, false)}
                            >
                              Marquer payé
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                      <CheckCircle className="h-12 w-12 text-emerald-500 mb-2" />
                      <p>Aucune charge en retard</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évolution des 6 derniers mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyTrend.map((month, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{month.month}</span>
                        <span className="text-muted-foreground">
                          {formatPrice(month.paid)} / {formatPrice(month.total)}
                        </span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-emerald-500 transition-all"
                          style={{ width: `${month.total > 0 ? (month.paid / month.total) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-destructive/60 transition-all"
                          style={{ width: `${month.total > 0 ? (month.unpaid / month.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>Payé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <span>Impayé</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
