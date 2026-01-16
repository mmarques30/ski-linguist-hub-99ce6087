import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodSelector } from "@/components/finance/PeriodSelector";
import { useCAByType, useInstructorBalance } from "@/hooks/useFinancialDashboard";
import { Download } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function FinanceAnalyses() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));

  const { data: caByType } = useCAByType(startDate, endDate, true);
  const { data: instructorBalance } = useInstructorBalance();

  // CA by client/school
  const { data: caByClient } = useQuery({
    queryKey: ['ca-by-client', startDate, endDate],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          amount_ht,
          inscription:inscription_id (
            ski_school:ski_school_id (
              id,
              name
            ),
            student:student_id (
              id,
              company,
              first_name,
              last_name
            )
          )
        `)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate)
        .neq('status', 'cancelled');

      // Group by client
      const byClient = new Map<string, { name: string; total: number; count: number }>();
      
      invoices?.forEach(inv => {
        const clientName = inv.inscription?.ski_school?.name || 
          inv.inscription?.student?.company || 
          `${inv.inscription?.student?.first_name || ''} ${inv.inscription?.student?.last_name || ''}`.trim() ||
          'Client inconnu';
        
        const clientId = inv.inscription?.ski_school?.id || inv.inscription?.student?.id || 'unknown';
        
        if (!byClient.has(clientId)) {
          byClient.set(clientId, { name: clientName, total: 0, count: 0 });
        }
        const entry = byClient.get(clientId)!;
        entry.total += Number(inv.amount_ht || 0);
        entry.count += 1;
      });

      return Array.from(byClient.values())
        .sort((a, b) => b.total - a.total);
    },
  });

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row => headers.map(h => row[h]).join(';'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analyses Financières</h1>
          <p className="text-muted-foreground">
            Analyse détaillée par activité, client et formateur
          </p>
        </div>

        {/* Period Selector */}
        <PeriodSelector
          startDate={startDate}
          endDate={endDate}
          onPeriodChange={handlePeriodChange}
        />

        {/* Tabs */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Par activité</TabsTrigger>
            <TabsTrigger value="client">Par client/ESF</TabsTrigger>
            <TabsTrigger value="instructor">Par formateur</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>CA par type d'activité</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportCSV(caByType || [], 'ca-par-activite')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activité</TableHead>
                      <TableHead className="text-right">CA N</TableHead>
                      <TableHead className="text-right">CA N-1</TableHead>
                      <TableHead className="text-right">Évolution</TableHead>
                      <TableHead className="text-right">% du total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caByType?.map((item) => {
                      const total = caByType.reduce((sum, i) => sum + i.value, 0);
                      const percent = total > 0 ? (item.value / total) * 100 : 0;
                      return (
                        <TableRow key={item.type}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.value)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatPrice(item.valueN1)}</TableCell>
                          <TableCell className="text-right">
                            {item.evolution !== null ? (
                              <span className={item.evolution >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                {item.evolution >= 0 ? '+' : ''}{item.evolution.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{percent.toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                    {caByType && caByType.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(caByType.reduce((sum, i) => sum + i.value, 0))}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatPrice(caByType.reduce((sum, i) => sum + i.valueN1, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const totalN = caByType.reduce((sum, i) => sum + i.value, 0);
                            const totalN1 = caByType.reduce((sum, i) => sum + i.valueN1, 0);
                            if (totalN1 === 0) return <span className="text-muted-foreground">-</span>;
                            const evol = ((totalN - totalN1) / totalN1) * 100;
                            return (
                              <span className={evol >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                {evol >= 0 ? '+' : ''}{evol.toFixed(1)}%
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>CA par client / ESF</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportCSV(caByClient || [], 'ca-par-client')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">CA HT</TableHead>
                      <TableHead className="text-right">Nb factures</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caByClient?.map((client, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="text-right">{formatPrice(client.total)}</TableCell>
                        <TableCell className="text-right">{client.count}</TableCell>
                      </TableRow>
                    ))}
                    {caByClient && caByClient.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(caByClient.reduce((sum, c) => sum + c.total, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          {caByClient.reduce((sum, c) => sum + c.count, 0)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructor">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Balance formateurs</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportCSV(
                    instructorBalance?.map(i => ({
                      Formateur: `${i.first_name} ${i.last_name}`,
                      Total_du: i.total_du,
                      Total_paye: i.total_paye,
                      A_payer: i.a_payer,
                    })) || [], 
                    'balance-formateurs'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Formateur</TableHead>
                      <TableHead className="text-right">Total dû</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">À payer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructorBalance?.map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">
                          {inst.first_name} {inst.last_name}
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(inst.total_du)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{formatPrice(inst.total_paye)}</TableCell>
                        <TableCell className="text-right text-amber-600 font-medium">{formatPrice(inst.a_payer)}</TableCell>
                      </TableRow>
                    ))}
                    {instructorBalance && instructorBalance.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(instructorBalance.reduce((sum, i) => sum + i.total_du, 0))}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {formatPrice(instructorBalance.reduce((sum, i) => sum + i.total_paye, 0))}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatPrice(instructorBalance.reduce((sum, i) => sum + i.a_payer, 0))}
                        </TableCell>
                      </TableRow>
                    )}
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
