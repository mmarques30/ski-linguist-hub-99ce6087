import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { FinanceKPICard } from "@/components/finance/FinanceKPICard";
import { InstructorPaymentDialog } from "@/components/finance/InstructorPaymentDialog";
import { AddCostDialog } from "@/components/finance/AddCostDialog";
import { 
  useFinancialKPIs, 
  useCAByMonth, 
  useCAByType, 
  usePendingInvoices, 
  useInstructorBalance,
  useFormationProfitability,
  useCostTemplates,
  useFixedCosts,
  useUpdateCostTemplate,
  useGenerateMonthlyCharges,
  useUpdateFixedCost,
  useTresoreriePrevisionnelle,
} from "@/hooks/useFinancialDashboard";
import { useFinancialRealtime } from "@/hooks/useFinancialRealtime";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, DollarSign, CreditCard, Users, TrendingUp, Download, 
  BarChart3, Ticket, CalendarRange, Plus, ChevronDown, ChevronRight, 
  Receipt, Landmark, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight, 
  Scale, AlertTriangle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, differenceInMonths, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
  PieChart as RechartsPie,
} from "recharts";

const BRAND_GOLD = 'hsl(40, 97%, 54%)';
const BRAND_NAVY = 'hsl(219, 52%, 16%)';
const BRAND_GRAY = 'hsl(0, 0%, 90%)';
const BRAND_BLACK = 'hsl(0, 0%, 9%)';
const CHART_COLORS = [BRAND_GOLD, BRAND_NAVY, BRAND_GRAY, BRAND_BLACK];

const costTypeLabels: Record<string, string> = {
  loyer: 'Loyer', telecom: 'Télécom', assurance: 'Assurance', comptable: 'Comptable',
  banque: 'Frais bancaires', logiciels: 'Logiciels', maintenance: 'Maintenance',
  qualiopi: 'Qualiopi', emprunt: 'Emprunt', autre: 'Autre',
};

export default function FinanceDashboard() {
  const { toast } = useToast();
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState<string | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Charges fixes state
  const currentMonth = format(startOfMonth(today), 'yyyy-MM-dd');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>('');

  useFinancialRealtime();

  // Data hooks
  const { data: kpis } = useFinancialKPIs(startDate, endDate, true);
  const { data: caByMonth } = useCAByMonth(startDate, endDate, true);
  const { data: caByType } = useCAByType(startDate, endDate, true);
  const { data: pendingInvoices } = usePendingInvoices();
  const { data: instructorBalance } = useInstructorBalance();
  const { data: formations } = useFormationProfitability(startDate, endDate);
  const { data: templates } = useCostTemplates();
  const { data: fixedCosts } = useFixedCosts(selectedMonth);
  const { data: allFixedCosts } = useFixedCosts();
  const { data: tresorerie, isLoading: tresorerieLoading } = useTresoreriePrevisionnelle(6);
  const updateTemplate = useUpdateCostTemplate();
  const generateCharges = useGenerateMonthlyCharges();
  const updateFixedCost = useUpdateFixedCost();

  // CA by client query
  const { data: caByClient } = useQuery({
    queryKey: ['ca-by-client', startDate, endDate],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`amount_ht, inscription:inscription_id ( ski_school:ski_school_id ( id, name ), student:student_id ( id, company, first_name, last_name ) )`)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .neq('status', 'cancelled');
      const byClient = new Map<string, { name: string; total: number; count: number }>();
      invoices?.forEach(inv => {
        const clientName = inv.inscription?.ski_school?.name || inv.inscription?.student?.company || `${inv.inscription?.student?.first_name || ''} ${inv.inscription?.student?.last_name || ''}`.trim() || 'Client inconnu';
        const clientId = inv.inscription?.ski_school?.id || inv.inscription?.student?.id || 'unknown';
        if (!byClient.has(clientId)) byClient.set(clientId, { name: clientName, total: 0, count: 0 });
        const entry = byClient.get(clientId)!;
        entry.total += Number(inv.amount_ht || 0);
        entry.count += 1;
      });
      return Array.from(byClient.values()).sort((a, b) => b.total - a.total);
    },
  });

  const handlePeriodChange = (start: string, end: string) => { setStartDate(start); setEndDate(end); };
  const handlePayInstructor = (instructor: any) => { setSelectedInstructor(instructor); setPaymentOpen(true); };
  const handleAddCost = (inscriptionId: string) => { setSelectedInscription(inscriptionId); setAddCostOpen(true); };
  const toggleRow = (id: string) => { const s = new Set(expandedRows); s.has(id) ? s.delete(id) : s.add(id); setExpandedRows(s); };

  const formatPrice = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatPricePrecise = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  // Revenue vs Expenses bars
  const revenueVsExpenses = useMemo(() => {
    if (!caByMonth) return [];
    return caByMonth.map(m => ({ label: new Date(m.month + '-01').toLocaleDateString('fr-FR', { month: 'short' }), revenue: m.total, expenses: m.totalN1 || 0 }));
  }, [caByMonth]);
  const maxBarValue = useMemo(() => revenueVsExpenses.length ? Math.max(...revenueVsExpenses.flatMap(m => [m.revenue, m.expenses]), 1) : 1, [revenueVsExpenses]);

  // Quarterly goals
  const quarterlyGoals = useMemo(() => {
    const caTotal = kpis?.caFacture || 0;
    const margeActuelle = kpis?.margePourcent || 0;
    const nbFormateurs = kpis?.formateursConcernes || 0;
    return [
      { label: 'Receita Trimestral', current: caTotal, target: 50000, format: 'price' as const },
      { label: 'Novos Stagiaires', current: nbFormateurs, target: 15, format: 'number' as const },
      { label: 'Marge cible', current: margeActuelle, target: 60, format: 'percent' as const },
    ];
  }, [kpis]);

  // Analyses KPIs
  const analysesKPIs = useMemo(() => {
    const nbFormations = caByType?.length || 0;
    const caTotal = caByType?.reduce((s, i) => s + i.value, 0) || 0;
    const ticketMoyen = nbFormations > 0 ? caTotal / nbFormations : 0;
    const nbMois = Math.max(differenceInMonths(new Date(endDate), new Date(startDate)), 1);
    const caMensuelMoyen = caTotal / nbMois;
    return { nbFormations, ticketMoyen, caMensuelMoyen };
  }, [caByType, startDate, endDate]);

  // Rentabilite
  const caTotal = formations?.reduce((sum, f) => sum + f.ca_ht, 0) || 0;
  const coutsTotal = formations?.reduce((sum, f) => sum + f.couts_totaux, 0) || 0;
  const margeTotal = caTotal - coutsTotal;
  const margeMoyenne = formations?.length ? formations.reduce((sum, f) => sum + f.marge_pourcent, 0) / formations.length : 0;
  const getMargeColor = (p: number) => p >= 50 ? 'text-[hsl(var(--fli-yellow))]' : p >= 30 ? 'text-foreground' : 'text-destructive';
  const getMargeBadge = (p: number) => p >= 50 ? <Badge className="bg-[hsl(var(--fli-yellow))]/15 text-[hsl(var(--fli-yellow))] border-[hsl(var(--fli-yellow))]/30">Excellent</Badge> : p >= 30 ? <Badge variant="secondary">Correct</Badge> : <Badge variant="destructive">Faible</Badge>;

  // Charges fixes
  const unpaidStats = useMemo(() => {
    if (!allFixedCosts) return { total: 0, count: 0, byType: [] as any[], overdue: [] as any[] };
    const currentMonthStart = startOfMonth(today);
    const unpaid = allFixedCosts.filter(c => !c.paye);
    const total = unpaid.reduce((sum, c) => sum + Number(c.montant), 0);
    const byTypeMap = new Map<string, number>();
    unpaid.forEach(c => { byTypeMap.set(c.cost_type, (byTypeMap.get(c.cost_type) || 0) + Number(c.montant)); });
    const byType = Array.from(byTypeMap.entries()).map(([name, value]) => ({ name: costTypeLabels[name] || name, value }));
    const overdue = unpaid.filter(c => isBefore(new Date(c.mois), currentMonthStart));
    return { total, count: unpaid.length, byType, overdue };
  }, [allFixedCosts]);

  const monthlyTrend = useMemo(() => {
    if (!allFixedCosts) return [];
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthStr = format(startOfMonth(date), 'yyyy-MM-dd');
      const mc = allFixedCosts.filter(c => c.mois === monthStr);
      const total = mc.reduce((s, c) => s + Number(c.montant), 0);
      const paid = mc.filter(c => c.paye).reduce((s, c) => s + Number(c.montant), 0);
      last6.push({ month: format(date, 'MMM', { locale: fr }), total, paid, unpaid: total - paid });
    }
    return last6;
  }, [allFixedCosts]);

  const months = [];
  for (let i = -3; i <= 3; i++) { const d = new Date(); d.setMonth(d.getMonth() + i); d.setDate(1); months.push({ value: format(d, 'yyyy-MM-dd'), label: format(d, 'MMMM yyyy', { locale: fr }) }); }

  const totalTemplates = templates?.filter(t => t.actif).reduce((s, t) => s + Number(t.montant_mensuel), 0) || 0;
  const totalCharges = fixedCosts?.reduce((s, c) => s + Number(c.montant), 0) || 0;
  const totalPaid = fixedCosts?.filter(c => c.paye).reduce((s, c) => s + Number(c.montant), 0) || 0;
  const paymentProgress = totalCharges > 0 ? (totalPaid / totalCharges) * 100 : 0;

  const handleToggleTemplate = async (id: string, currentActive: boolean) => { try { await updateTemplate.mutateAsync({ id, actif: !currentActive }); toast({ title: "Modèle mis à jour" }); } catch (e: any) { toast({ variant: "destructive", title: "Erreur", description: e.message }); }};
  const handleSaveTemplateAmount = async (id: string) => { try { await updateTemplate.mutateAsync({ id, montant_mensuel: Number(editedAmount) }); setEditingTemplate(null); toast({ title: "Montant mis à jour" }); } catch (e: any) { toast({ variant: "destructive", title: "Erreur", description: e.message }); }};
  const handleGenerateCharges = async () => { try { await generateCharges.mutateAsync(selectedMonth); toast({ title: "Charges générées" }); } catch (e: any) { toast({ variant: "destructive", title: "Erreur", description: e.message }); }};
  const handleTogglePaid = async (id: string, currentPaid: boolean) => { try { await updateFixedCost.mutateAsync({ id, paye: !currentPaid, date_paiement: !currentPaid ? format(new Date(), 'yyyy-MM-dd') : null }); toast({ title: currentPaid ? "Marqué comme non payé" : "Marqué comme payé" }); } catch (e: any) { toast({ variant: "destructive", title: "Erreur", description: e.message }); }};

  // Tresorerie
  let cumulativeBalance = 0;
  const tresorerieWithCumulative = tresorerie?.map(m => { cumulativeBalance += m.solde; return { ...m, soldeCumulatif: cumulativeBalance }; });
  const hasNegativeBalance = tresorerieWithCumulative?.some(m => m.soldeCumulatif < 0);
  const tresoKPIs = useMemo(() => {
    if (!tresorerieWithCumulative?.length) return { soldeActuel: 0, entreesPrevues: 0, sortiesPrevues: 0, soldePrevisionnel: 0 };
    return { soldeActuel: tresorerieWithCumulative[0]?.solde || 0, entreesPrevues: tresorerieWithCumulative.reduce((s, m) => s + m.entrees, 0), sortiesPrevues: tresorerieWithCumulative.reduce((s, m) => s + m.sorties, 0), soldePrevisionnel: tresorerieWithCumulative[tresorerieWithCumulative.length - 1]?.soldeCumulatif || 0 };
  }, [tresorerieWithCumulative]);
  const chartData = useMemo(() => tresorerieWithCumulative?.map(m => ({ name: m.moisLabel, solde: m.soldeCumulatif })) || [], [tresorerieWithCumulative]);

  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(';'), ...data.map(row => headers.map(h => row[h]).join(';'))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `${filename}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* ============ HEADER ============ */}
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Vue d'ensemble complète de la gestion financière</p>
        </div>

        <PeriodSelector startDate={startDate} endDate={endDate} onPeriodChange={handlePeriodChange} />

        {/* ============ SECTION: VUE D'ENSEMBLE ============ */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Vue d'ensemble</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FinanceKPICard title="CA Facturé" value={kpis?.caFacture || 0} subtitle={`${kpis?.nbFactures || 0} factures`} evolution={kpis?.caFactureEvol ?? undefined} variant="gold" formatAsPrice icon={DollarSign} />
            <FinanceKPICard title="Encaissé" value={kpis?.encaisse || 0} subtitle={`${formatPrice(kpis?.enAttente || 0)} en attente`} evolution={kpis?.encaisseEvol ?? undefined} variant="gold" formatAsPrice icon={CreditCard} />
            <FinanceKPICard title="À payer formateurs" value={kpis?.aPayerFormateurs || 0} subtitle={`${kpis?.formateursConcernes || 0} formateurs`} evolution={kpis?.aPayerFormateursEvol ?? undefined} variant="navy" formatAsPrice icon={Users} />
            <FinanceKPICard title="Marge brute" value={kpis?.margeBrute || 0} subtitle={`${kpis?.margePourcent?.toFixed(1) || 0}% du CA`} evolution={kpis?.margeBruteEvol ?? undefined} variant={kpis?.margePourcent && kpis.margePourcent >= 50 ? 'gold' : 'navy'} formatAsPrice icon={TrendingUp} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Receitas vs Despesas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--fli-yellow))]" /><span className="text-muted-foreground">Receitas</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--fli-navy))]" /><span className="text-muted-foreground">Despesas</span></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueVsExpenses.length > 0 ? revenueVsExpenses.map((m, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize w-12">{m.label}</span>
                        <div className="flex gap-4 text-xs text-muted-foreground"><span>{formatPrice(m.revenue)}</span><span>{formatPrice(m.expenses)}</span></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-[hsl(var(--fli-yellow))] transition-all duration-500" style={{ width: `${(m.revenue / maxBarValue) * 100}%` }} /></div>
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-[hsl(var(--fli-navy))] transition-all duration-500" style={{ width: `${(m.expenses / maxBarValue) * 100}%` }} /></div>
                      </div>
                    </div>
                  )) : <p className="text-center text-muted-foreground py-8">Aucune donnée</p>}
                </div>
              </CardContent>
            </Card>

            {/* Répartition par activité */}
            <Card>
              <CardHeader><CardTitle className="text-base">Répartition par activité</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={caByType || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={100} dataKey="value">
                        {caByType?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => formatPrice(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metas do Trimestre */}
          <Card>
            <CardHeader><CardTitle className="text-base">Metas do Trimestre</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {quarterlyGoals.map((goal, idx) => {
                  const progress = Math.min((goal.current / goal.target) * 100, 100);
                  const dc = goal.format === 'price' ? formatPrice(goal.current) : goal.format === 'percent' ? `${goal.current.toFixed(1)}%` : goal.current.toString();
                  const dt = goal.format === 'price' ? formatPrice(goal.target) : goal.format === 'percent' ? `${goal.target}%` : goal.target.toString();
                  return (<div key={idx} className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="font-medium">{goal.label}</span><span className="text-muted-foreground">{dc} / {dt}</span></div><Progress value={progress} className="h-2.5 [&>div]:bg-[hsl(var(--fli-yellow))]" /></div>);
                })}
              </div>
            </CardContent>
          </Card>

          {/* CA Evolution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Évolution du CA</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={caByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickFormatter={v => new Date(v + '-01').toLocaleDateString('fr-FR', { month: 'short' })} className="text-xs" />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number, n: string) => [formatPrice(v), n === 'total' ? 'CA N' : 'CA N-1']} />
                    <Line type="monotone" dataKey="total" stroke={BRAND_GOLD} strokeWidth={2} dot={{ fill: BRAND_GOLD }} />
                    <Line type="monotone" dataKey="totalN1" stroke={BRAND_NAVY} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: BRAND_NAVY }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tables: Pending + Instructors */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Factures en attente</CardTitle><Badge variant="secondary">{pendingInvoices?.length || 0}</Badge></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>N° Facture</TableHead><TableHead>Client</TableHead><TableHead className="text-right">Montant</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {pendingInvoices?.slice(0, 5).map(inv => (
                      <TableRow key={inv.id}><TableCell className="font-medium">{inv.invoice_number}</TableCell><TableCell className="truncate max-w-[120px]">{inv.client_name}</TableCell><TableCell className="text-right">{formatPrice(Number(inv.amount_ttc || inv.amount_ht))}</TableCell><TableCell>{inv.days_overdue > 0 ? <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />+{inv.days_overdue}j</Badge> : <Badge variant="secondary">En attente</Badge>}</TableCell></TableRow>
                    ))}
                    {(!pendingInvoices || pendingInvoices.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucune facture en attente</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Formateurs à payer</CardTitle><Badge variant="secondary">{instructorBalance?.length || 0}</Badge></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Formateur</TableHead><TableHead className="text-right">À payer</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {instructorBalance?.slice(0, 5).map(inst => (
                      <TableRow key={inst.id}><TableCell className="font-medium">{inst.first_name} {inst.last_name}</TableCell><TableCell className="text-right font-medium">{formatPrice(inst.a_payer)}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => handlePayInstructor(inst)}>Payer</Button></TableCell></TableRow>
                    ))}
                    {(!instructorBalance || instructorBalance.length === 0) && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Tous les formateurs sont payés</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============ SECTION: ANALYSES ============ */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Analyses</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <FinanceKPICard title="Nb activités" value={analysesKPIs.nbFormations} variant="gold" icon={BarChart3} />
            <FinanceKPICard title="Ticket moyen" value={analysesKPIs.ticketMoyen} variant="navy" formatAsPrice icon={Ticket} />
            <FinanceKPICard title="CA mensuel moyen" value={analysesKPIs.caMensuelMoyen} variant="gold" formatAsPrice icon={CalendarRange} />
          </div>

          {/* CA par activité */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">CA par type d'activité</CardTitle><Button variant="outline" size="sm" onClick={() => exportCSV(caByType || [], 'ca-par-activite')}><Download className="h-4 w-4 mr-2" />Export CSV</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Activité</TableHead><TableHead className="text-right">CA N</TableHead><TableHead className="text-right">CA N-1</TableHead><TableHead className="text-right">Évolution</TableHead><TableHead className="text-right">% du total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {caByType?.map(item => {
                    const total = caByType.reduce((s, i) => s + i.value, 0);
                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                    return (<TableRow key={item.type}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right">{formatPrice(item.value)}</TableCell><TableCell className="text-right text-muted-foreground">{formatPrice(item.valueN1)}</TableCell><TableCell className="text-right">{item.evolution !== null ? <span className={item.evolution >= 0 ? 'text-[hsl(var(--fli-yellow))]' : 'text-destructive'}>{item.evolution >= 0 ? '+' : ''}{item.evolution.toFixed(1)}%</span> : <span className="text-muted-foreground">-</span>}</TableCell><TableCell className="text-right">{pct.toFixed(1)}%</TableCell></TableRow>);
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* CA par client */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">CA par client / ESF</CardTitle><Button variant="outline" size="sm" onClick={() => exportCSV(caByClient || [], 'ca-par-client')}><Download className="h-4 w-4 mr-2" />Export CSV</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">CA HT</TableHead><TableHead className="text-right">Nb factures</TableHead></TableRow></TableHeader>
                <TableBody>
                  {caByClient?.map((c, i) => <TableRow key={i}><TableCell className="font-medium">{c.name}</TableCell><TableCell className="text-right">{formatPrice(c.total)}</TableCell><TableCell className="text-right">{c.count}</TableCell></TableRow>)}
                  {caByClient && caByClient.length > 0 && <TableRow className="bg-muted/50 font-medium"><TableCell>Total</TableCell><TableCell className="text-right">{formatPrice(caByClient.reduce((s, c) => s + c.total, 0))}</TableCell><TableCell className="text-right">{caByClient.reduce((s, c) => s + c.count, 0)}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Balance formateurs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Balance formateurs</CardTitle><Button variant="outline" size="sm" onClick={() => exportCSV(instructorBalance?.map(i => ({ Formateur: `${i.first_name} ${i.last_name}`, Total_du: i.total_du, Total_paye: i.total_paye, A_payer: i.a_payer })) || [], 'balance-formateurs')}><Download className="h-4 w-4 mr-2" />Export CSV</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Formateur</TableHead><TableHead className="text-right">Total dû</TableHead><TableHead className="text-right">Payé</TableHead><TableHead className="text-right">À payer</TableHead></TableRow></TableHeader>
                <TableBody>
                  {instructorBalance?.map(inst => <TableRow key={inst.id}><TableCell className="font-medium">{inst.first_name} {inst.last_name}</TableCell><TableCell className="text-right">{formatPrice(inst.total_du)}</TableCell><TableCell className="text-right text-[hsl(var(--fli-yellow))]">{formatPrice(inst.total_paye)}</TableCell><TableCell className="text-right font-medium">{formatPrice(inst.a_payer)}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ============ SECTION: RENTABILITÉ ============ */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold">Rentabilité</h2>
            <Button size="sm" onClick={() => { setSelectedInscription(undefined); setAddCostOpen(true); }}><Plus className="h-4 w-4 mr-2" />Ajouter un coût</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FinanceKPICard title="Marge brute" value={margeTotal} subtitle={`${margeMoyenne.toFixed(1)}% en moyenne`} variant="gold" formatAsPrice icon={TrendingUp} />
            <FinanceKPICard title="Coûts directs" value={coutsTotal} subtitle={`${formations?.length || 0} formations`} variant="navy" formatAsPrice icon={Receipt} />
            <FinanceKPICard title="CA Total" value={caTotal} variant="gold" formatAsPrice icon={Landmark} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Détail par formation</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Formation</TableHead><TableHead>Date</TableHead><TableHead className="text-right">CA HT</TableHead><TableHead className="text-right">Coûts</TableHead><TableHead className="text-right">Marge</TableHead><TableHead className="text-right">%</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {formations?.map(f => (
                    <Collapsible key={f.id} asChild open={expandedRows.has(f.id!)}>
                      <>
                        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(f.id!)}>
                          <TableCell><CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="h-6 w-6 p-0">{expandedRows.has(f.id!) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button></CollapsibleTrigger></TableCell>
                          <TableCell><div><p className="font-medium">{f.code || 'Sans code'}</p><p className="text-sm text-muted-foreground">{f.student_name}</p></div></TableCell>
                          <TableCell className="text-sm">{f.start_date && format(new Date(f.start_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(f.ca_ht)}</TableCell>
                          <TableCell className="text-right">{formatPrice(f.couts_totaux)}</TableCell>
                          <TableCell className={cn("text-right font-medium", getMargeColor(f.marge_pourcent))}>{formatPrice(f.marge_brute)}</TableCell>
                          <TableCell className="text-right">{getMargeBadge(f.marge_pourcent)}</TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); handleAddCost(f.id!); }}><Plus className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30"><TableCell></TableCell><TableCell colSpan={7}><div className="py-2 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm"><div><p className="text-muted-foreground">Formateur</p><p className="font-medium">{formatPrice(f.cout_formateur)}</p></div><div><p className="text-muted-foreground">Hébergement</p><p className="font-medium">{formatPrice(f.cout_hebergement)}</p></div><div><p className="text-muted-foreground">Déplacement</p><p className="font-medium">{formatPrice(f.cout_deplacement)}</p></div><div><p className="text-muted-foreground">Salle</p><p className="font-medium">{formatPrice(f.cout_salle)}</p></div><div><p className="text-muted-foreground">Autres</p><p className="font-medium">{formatPrice(f.cout_autres)}</p></div></div></TableCell></TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                  {(!formations || formations.length === 0) && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune formation avec données financières</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ============ SECTION: TRÉSORERIE ============ */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Trésorerie Prévisionnelle</h2>

          <div className="grid gap-4 md:grid-cols-4">
            <FinanceKPICard title="Solde actuel" value={tresoKPIs.soldeActuel} variant={tresoKPIs.soldeActuel >= 0 ? 'gold' : 'navy'} formatAsPrice icon={Wallet} />
            <FinanceKPICard title="Entrées prévues" value={tresoKPIs.entreesPrevues} variant="gold" formatAsPrice icon={ArrowUpRight} />
            <FinanceKPICard title="Sorties prévues" value={tresoKPIs.sortiesPrevues} variant="navy" formatAsPrice icon={ArrowDownRight} />
            <FinanceKPICard title="Solde prévisionnel" value={tresoKPIs.soldePrevisionnel} variant={tresoKPIs.soldePrevisionnel >= 0 ? 'gold' : 'navy'} formatAsPrice icon={Scale} />
          </div>

          {hasNegativeBalance && (
            <Card className="border-destructive/50 bg-destructive/5"><CardContent className="flex items-center gap-3 py-4"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="font-medium">Attention: Solde prévisionnel négatif détecté</p><p className="text-sm text-muted-foreground">Certains mois présentent un déficit prévu</p></div></CardContent></Card>
          )}

          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Projection de Trésorerie</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [formatPrice(v), 'Solde cumulatif']} />
                      <defs><linearGradient id="soldeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND_GOLD} stopOpacity={0.3} /><stop offset="95%" stopColor={BRAND_GOLD} stopOpacity={0} /></linearGradient></defs>
                      <Area type="monotone" dataKey="solde" stroke={BRAND_GOLD} strokeWidth={2} fill="url(#soldeGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Flux de trésorerie prévisionnels</CardTitle></CardHeader>
            <CardContent>
              {tresorerieLoading ? <p className="text-center text-muted-foreground py-8">Chargement...</p> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead className="min-w-[150px]"></TableHead>{tresorerieWithCumulative?.map(m => <TableHead key={m.mois} className="text-center min-w-[120px]">{m.moisLabel}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>
                      <TableRow className="bg-[hsl(var(--fli-yellow))]/5"><TableCell className="font-medium text-[hsl(var(--fli-yellow))]">Entrées prévues</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className="text-center font-medium text-[hsl(var(--fli-yellow))]">{formatPrice(m.entrees)}</TableCell>)}</TableRow>
                      <TableRow><TableCell className="text-sm text-muted-foreground pl-8">Factures à encaisser</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.facturesAEncaisser)}</TableCell>)}</TableRow>
                      <TableRow><TableCell className="text-sm text-muted-foreground pl-8">Formations planifiées</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.formationsPlanifiees)}</TableCell>)}</TableRow>
                      <TableRow className="bg-[hsl(var(--fli-navy))]/5"><TableCell className="font-medium text-[hsl(var(--fli-navy))]">Sorties prévues</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className="text-center font-medium text-[hsl(var(--fli-navy))]">{formatPrice(m.sorties)}</TableCell>)}</TableRow>
                      <TableRow><TableCell className="text-sm text-muted-foreground pl-8">Charges fixes</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.chargesFixes)}</TableCell>)}</TableRow>
                      <TableRow><TableCell className="text-sm text-muted-foreground pl-8">Formateurs à payer</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className="text-center text-sm">{formatPrice(m.formateursAPayer)}</TableCell>)}</TableRow>
                      <TableRow className="border-t-2"><TableCell className="font-medium">Solde mensuel</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className={cn("text-center font-medium", m.solde >= 0 ? "text-[hsl(var(--fli-yellow))]" : "text-destructive")}>{formatPrice(m.solde)}</TableCell>)}</TableRow>
                      <TableRow className="bg-muted/50"><TableCell className="font-bold">Solde cumulatif</TableCell>{tresorerieWithCumulative?.map(m => <TableCell key={m.mois} className="text-center"><Badge variant={m.soldeCumulatif >= 0 ? "default" : "destructive"} className={cn("text-sm font-bold", m.soldeCumulatif >= 0 ? "bg-[hsl(var(--fli-yellow))]/15 text-[hsl(var(--fli-yellow))] border-[hsl(var(--fli-yellow))]/30" : "")}>{formatPrice(m.soldeCumulatif)}</Badge></TableCell>)}</TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ============ SECTION: CHARGES FIXES ============ */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-2">
            <h2 className="text-lg font-semibold">Charges Fixes</h2>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 border rounded-md bg-background text-sm">
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-card border border-border rounded-lg p-4 border-l-4 border-l-destructive"><p className="text-sm text-muted-foreground">Total impayé</p><p className="text-2xl font-bold text-destructive">{formatPricePrecise(unpaidStats.total)}</p><p className="text-xs text-muted-foreground mt-1">{unpaidStats.count} charge(s)</p></div>
            <div className={`bg-card border border-border rounded-lg p-4 border-l-4 ${unpaidStats.overdue.length > 0 ? 'border-l-destructive' : 'border-l-[hsl(var(--fli-yellow))]'}`}><p className="text-sm text-muted-foreground">En retard</p><p className={`text-2xl font-bold ${unpaidStats.overdue.length > 0 ? 'text-destructive' : 'text-[hsl(var(--fli-yellow))]'}`}>{unpaidStats.overdue.length}</p><p className="text-xs text-muted-foreground mt-1">{formatPricePrecise(unpaidStats.overdue.reduce((s, c) => s + Number(c.montant), 0))}</p></div>
            <div className="bg-card border border-border rounded-lg p-4 border-l-4 border-l-[hsl(var(--fli-yellow))]"><p className="text-sm text-muted-foreground">Ce mois</p><p className="text-2xl font-bold">{formatPricePrecise(totalCharges)}</p><div className="mt-2"><Progress value={paymentProgress} className="h-2" /><p className="text-xs text-muted-foreground mt-1">{Math.round(paymentProgress)}% payé</p></div></div>
            <div className="bg-card border border-border rounded-lg p-4 border-l-4 border-l-[hsl(var(--fli-navy))]"><p className="text-sm text-muted-foreground">Mensuel prévu</p><p className="text-2xl font-bold">{formatPricePrecise(totalTemplates)}</p><p className="text-xs text-muted-foreground mt-1">{templates?.filter(t => t.actif).length} modèles actifs</p></div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Répartition des impayés</CardTitle></CardHeader>
              <CardContent>
                {unpaidStats.byType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie><Pie data={unpaidStats.byType} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>{unpaidStats.byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => formatPricePrecise(v)} /></RechartsPie>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[250px] text-muted-foreground"><p>Toutes les charges sont payées</p></div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Charges en retard</CardTitle></CardHeader>
              <CardContent>
                {unpaidStats.overdue.length > 0 ? (
                  <div className="space-y-3 max-h-[250px] overflow-auto">
                    {unpaidStats.overdue.map(cost => (
                      <div key={cost.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                        <div><p className="font-medium">{costTypeLabels[cost.cost_type] || cost.cost_type}</p><p className="text-sm text-muted-foreground">{format(new Date(cost.mois), 'MMMM yyyy', { locale: fr })}</p></div>
                        <div className="text-right"><p className="font-bold">{formatPricePrecise(Number(cost.montant))}</p><Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => handleTogglePaid(cost.id, false)}>Marquer payé</Button></div>
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-[250px] text-muted-foreground"><p>Aucune charge en retard</p></div>}
              </CardContent>
            </Card>
          </div>

          {/* Charges du mois */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Charges de {format(new Date(selectedMonth), 'MMMM yyyy', { locale: fr })}</CardTitle><Button onClick={handleGenerateCharges} disabled={generateCharges.isPending} size="sm"><RefreshCw className={`h-4 w-4 mr-2 ${generateCharges.isPending ? 'animate-spin' : ''}`} />Générer les charges</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Montant</TableHead><TableHead className="text-center">Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {fixedCosts?.map(cost => (
                    <TableRow key={cost.id}><TableCell className="font-medium">{costTypeLabels[cost.cost_type] || cost.cost_type}</TableCell><TableCell className="text-muted-foreground">{cost.description}</TableCell><TableCell className="text-right font-medium">{formatPricePrecise(Number(cost.montant))}</TableCell><TableCell className="text-center">{cost.paye ? <Badge className="bg-[hsl(var(--fli-yellow))]/15 text-[hsl(var(--fli-yellow))] border-[hsl(var(--fli-yellow))]/30">Payé</Badge> : <Badge variant="secondary">À payer</Badge>}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => handleTogglePaid(cost.id, cost.paye)}>{cost.paye ? 'Annuler' : 'Marquer payé'}</Button></TableCell></TableRow>
                  ))}
                  {(!fixedCosts || fixedCosts.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune charge pour ce mois.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Evolution 6 mois */}
          <Card>
            <CardHeader><CardTitle className="text-base">Évolution des 6 derniers mois</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTrend.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="capitalize font-medium">{m.month}</span><span className="text-muted-foreground">{formatPricePrecise(m.paid)} / {formatPricePrecise(m.total)}</span></div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted"><div className="bg-[hsl(var(--fli-yellow))] transition-all" style={{ width: `${m.total > 0 ? (m.paid / m.total) * 100 : 0}%` }} /><div className="bg-[hsl(var(--fli-navy))]/60 transition-all" style={{ width: `${m.total > 0 ? (m.unpaid / m.total) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[hsl(var(--fli-yellow))]" /><span>Payé</span></div><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-[hsl(var(--fli-navy))]/60" /><span>Impayé</span></div></div>
            </CardContent>
          </Card>

          {/* Modèles récurrents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Modèles récurrents</CardTitle><p className="text-sm text-muted-foreground">{templates?.filter(t => t.actif).length} / {templates?.length} actifs · {formatPricePrecise(totalTemplates)}/mois</p></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Montant mensuel</TableHead><TableHead className="text-center">Actif</TableHead></TableRow></TableHeader>
                <TableBody>
                  {templates?.map(t => (
                    <TableRow key={t.id}><TableCell className="font-medium">{costTypeLabels[t.cost_type] || t.cost_type}</TableCell><TableCell className="text-muted-foreground">{t.description}</TableCell><TableCell className="text-right">{editingTemplate === t.id ? <div className="flex items-center justify-end gap-2"><Input type="number" step="0.01" value={editedAmount} onChange={e => setEditedAmount(e.target.value)} className="w-24 text-right" /><Button size="sm" onClick={() => handleSaveTemplateAmount(t.id)}>OK</Button><Button size="sm" variant="ghost" onClick={() => setEditingTemplate(null)}>X</Button></div> : <Button variant="ghost" className="font-medium" onClick={() => { setEditingTemplate(t.id); setEditedAmount(t.montant_mensuel.toString()); }}>{formatPricePrecise(Number(t.montant_mensuel))}</Button>}</TableCell><TableCell className="text-center"><Switch checked={t.actif} onCheckedChange={() => handleToggleTemplate(t.id, t.actif)} /></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>

      <InstructorPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} instructor={selectedInstructor} />
      <AddCostDialog open={addCostOpen} onOpenChange={setAddCostOpen} inscriptionId={selectedInscription} />
    </MainLayout>
  );
}
