import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { FinanceKPICard } from "@/components/finance/FinanceKPICard";
import { AddCostDialog } from "@/components/finance/AddCostDialog";
import { InstructorPaymentDialog } from "@/components/finance/InstructorPaymentDialog";
import { 
  useFinancialKPIs, 
  useCAByMonth, 
  useCAByType, 
  usePendingInvoices, 
  useInstructorBalance,
} from "@/hooks/useFinancialDashboard";
import { 
  Receipt, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Plus,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function FinanceDashboard() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

  const { data: kpis, isLoading: kpisLoading } = useFinancialKPIs(startDate, endDate);
  const { data: caByMonth } = useCAByMonth(startDate, endDate);
  const { data: caByType } = useCAByType(startDate, endDate);
  const { data: pendingInvoices } = usePendingInvoices();
  const { data: instructorBalance } = useInstructorBalance();

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handlePayInstructor = (instructor: any) => {
    setSelectedInstructor(instructor);
    setPaymentOpen(true);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Financier</h1>
            <p className="text-muted-foreground">
              Vue d'ensemble de la performance financière
            </p>
          </div>
          <Button onClick={() => setAddCostOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un coût
          </Button>
        </div>

        {/* Period Selector */}
        <PeriodSelector
          startDate={startDate}
          endDate={endDate}
          onPeriodChange={handlePeriodChange}
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FinanceKPICard
            title="CA Facturé"
            value={kpis?.caFacture || 0}
            subtitle={`${kpis?.nbFactures || 0} factures`}
            icon={Receipt}
            variant="info"
            formatAsPrice
          />
          <FinanceKPICard
            title="Encaissé"
            value={kpis?.encaisse || 0}
            subtitle={`${formatPrice(kpis?.enAttente || 0)} en attente`}
            icon={CreditCard}
            variant="success"
            formatAsPrice
          />
          <FinanceKPICard
            title="À payer formateurs"
            value={kpis?.aPayerFormateurs || 0}
            subtitle={`${kpis?.formateursConcernes || 0} formateurs`}
            icon={Users}
            variant="warning"
            formatAsPrice
          />
          <FinanceKPICard
            title="Marge brute"
            value={kpis?.margeBrute || 0}
            subtitle={`${kpis?.margePourcent?.toFixed(1) || 0}% du CA`}
            icon={TrendingUp}
            variant={kpis?.margePourcent && kpis.margePourcent >= 50 ? 'success' : kpis?.margePourcent && kpis.margePourcent >= 30 ? 'warning' : 'danger'}
            formatAsPrice
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* CA Evolution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution du CA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={caByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(v) => {
                        const date = new Date(v + '-01');
                        return date.toLocaleDateString('fr-FR', { month: 'short' });
                      }}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => formatPrice(value)}
                      labelFormatter={(label) => {
                        const date = new Date(label + '-01');
                        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CA by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition par activité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {caByType?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Factures en attente</CardTitle>
              <Badge variant="secondary">{pendingInvoices?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices?.slice(0, 5).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="truncate max-w-[120px]">{invoice.client_name}</TableCell>
                      <TableCell className="text-right">{formatPrice(Number(invoice.amount_ttc || invoice.amount_ht))}</TableCell>
                      <TableCell>
                        {invoice.days_overdue > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            +{invoice.days_overdue}j
                          </Badge>
                        ) : (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!pendingInvoices || pendingInvoices.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        Aucune facture en attente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Instructors to Pay */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Formateurs à payer</CardTitle>
              <Badge variant="secondary">{instructorBalance?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formateur</TableHead>
                    <TableHead className="text-right">À payer</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorBalance?.slice(0, 5).map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="font-medium">
                        {instructor.first_name} {instructor.last_name}
                      </TableCell>
                      <TableCell className="text-right font-medium text-amber-600">
                        {formatPrice(instructor.a_payer)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePayInstructor(instructor)}
                        >
                          Payer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!instructorBalance || instructorBalance.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        Tous les formateurs sont payés
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddCostDialog open={addCostOpen} onOpenChange={setAddCostOpen} />
      <InstructorPaymentDialog 
        open={paymentOpen} 
        onOpenChange={setPaymentOpen}
        instructor={selectedInstructor}
      />
    </MainLayout>
  );
}
