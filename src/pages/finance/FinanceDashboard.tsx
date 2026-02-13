import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { useFinancialRealtime } from "@/hooks/useFinancialRealtime";
import { AlertCircle } from "lucide-react";
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

const BRAND_GOLD = 'hsl(40, 97%, 54%)';
const BRAND_NAVY = 'hsl(219, 52%, 16%)';
const BRAND_GRAY = 'hsl(0, 0%, 90%)';
const BRAND_BLACK = 'hsl(0, 0%, 9%)';
const CHART_COLORS = [BRAND_GOLD, BRAND_NAVY, BRAND_GRAY, BRAND_BLACK];

export default function FinanceDashboard() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);

  useFinancialRealtime();

  const { data: kpis } = useFinancialKPIs(startDate, endDate, true);
  const { data: caByMonth } = useCAByMonth(startDate, endDate, true);
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
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financier</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de la performance financière
          </p>
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
            evolution={kpis?.caFactureEvol ?? undefined}
            variant="gold"
            formatAsPrice
          />
          <FinanceKPICard
            title="Encaissé"
            value={kpis?.encaisse || 0}
            subtitle={`${formatPrice(kpis?.enAttente || 0)} en attente`}
            evolution={kpis?.encaisseEvol ?? undefined}
            variant="gold"
            formatAsPrice
          />
          <FinanceKPICard
            title="À payer formateurs"
            value={kpis?.aPayerFormateurs || 0}
            subtitle={`${kpis?.formateursConcernes || 0} formateurs`}
            evolution={kpis?.aPayerFormateursEvol ?? undefined}
            variant="navy"
            formatAsPrice
          />
          <FinanceKPICard
            title="Marge brute"
            value={kpis?.margeBrute || 0}
            subtitle={`${kpis?.margePourcent?.toFixed(1) || 0}% du CA`}
            evolution={kpis?.margeBruteEvol ?? undefined}
            variant={kpis?.margePourcent && kpis.margePourcent >= 50 ? 'gold' : 'navy'}
            formatAsPrice
          />
        </div>

        {/* Charts Row 1 */}
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
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [
                        formatPrice(value),
                        name === 'total' ? 'CA N' : 'CA N-1'
                      ]}
                      labelFormatter={(label) => {
                        const date = new Date(label + '-01');
                        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                      }}
                    />
                    <Legend formatter={(value) => value === 'total' ? 'CA N' : 'CA N-1'} />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      name="total"
                      stroke={BRAND_GOLD}
                      strokeWidth={2}
                      dot={{ fill: BRAND_GOLD }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalN1" 
                      name="totalN1"
                      stroke={BRAND_NAVY}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: BRAND_NAVY }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Répartition par activité */}
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
                      {caByType?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number) => formatPrice(value)} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparaison CA N vs N-1 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparaison CA mensuel N vs N-1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [
                      formatPrice(value),
                      name === 'total' ? 'CA N' : 'CA N-1'
                    ]}
                    labelFormatter={(label) => {
                      const date = new Date(label + '-01');
                      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    }}
                  />
                  <Legend formatter={(value) => value === 'total' ? 'CA N' : 'CA N-1'} />
                  <Bar 
                    dataKey="total" 
                    name="total"
                    fill={BRAND_GOLD}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="totalN1" 
                    name="totalN1"
                    fill={BRAND_NAVY}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
                      <TableCell className="text-right font-medium">
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
