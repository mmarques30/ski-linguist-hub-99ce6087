import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FinanceKPICard } from "@/components/finance/FinanceKPICard";
import { usePayments, usePaymentKPIs, useCreatePayment } from "@/hooks/usePayments";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { DollarSign, Clock, AlertTriangle, Percent, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  en_attente: "bg-yellow-100 text-yellow-800",
  recu: "bg-emerald-100 text-emerald-800",
  echoue: "bg-red-100 text-red-800",
  rembourse: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  recu: "Reçu",
  echoue: "Échoué",
  rembourse: "Remboursé",
};

const METHOD_LABELS: Record<string, string> = {
  carte_bancaire: "Carte bancaire",
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
  opco: "OPCO",
};

const PAYER_LABELS: Record<string, string> = {
  stagiaire: "Stagiaire",
  opco: "OPCO",
  esf: "ESF",
  autre: "Autre",
};

export default function FinancePayments() {
  const today = new Date();
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const { canEdit } = useUserPermissions();
  const editable = canEdit("finance");

  const startDate = format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = format(endOfMonth(today), "yyyy-MM-dd");

  const { data: payments = [], isLoading } = usePayments({
    status: statusFilter,
    method: methodFilter,
  });
  const { data: kpis } = usePaymentKPIs(startDate, endDate);
  const createPayment = useCreatePayment();

  const [form, setForm] = useState({
    amount: "",
    payment_method: "virement",
    payment_date: format(today, "yyyy-MM-dd"),
    status: "recu",
    payer_type: "stagiaire",
    payer_name: "",
    reference: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Montant invalide");
      return;
    }
    try {
      await createPayment.mutateAsync({
        amount: Number(form.amount),
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        status: form.status,
        payer_type: form.payer_type,
        payer_name: form.payer_name || null,
        reference: form.reference || null,
        notes: form.notes || null,
      });
      toast.success("Paiement enregistré");
      setCreateOpen(false);
      setForm({
        amount: "",
        payment_method: "virement",
        payment_date: format(today, "yyyy-MM-dd"),
        status: "recu",
        payer_type: "stagiaire",
        payer_name: "",
        reference: "",
        notes: "",
      });
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const getClientName = (p: typeof payments[0]) => {
    if (p.payer_name) return p.payer_name;
    const student = p.inscription?.student;
    if (student) return student.company || `${student.first_name} ${student.last_name}`;
    return "-";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Suivi des Paiements</h1>
            <p className="text-muted-foreground">Gestion centralisée de tous les encaissements</p>
          </div>
          {editable && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Enregistrer un paiement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer un paiement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Montant (€)</Label>
                      <Input
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={form.payment_date}
                        onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Méthode</Label>
                      <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(METHOD_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type de payeur</Label>
                      <Select value={form.payer_type} onValueChange={(v) => setForm({ ...form, payer_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAYER_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nom du payeur</Label>
                      <Input
                        value={form.payer_name}
                        onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
                        placeholder="Nom / Entreprise"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Référence</Label>
                    <Input
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      placeholder="N° de transaction, chèque..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full" disabled={createPayment.isPending}>
                    {createPayment.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <FinanceKPICard
            title="Encaissé ce mois"
            value={kpis?.totalReceived || 0}
            variant="gold"
            formatAsPrice
            icon={DollarSign}
          />
          <FinanceKPICard
            title="En attente"
            value={kpis?.totalPending || 0}
            variant="navy"
            formatAsPrice
            icon={Clock}
          />
          <FinanceKPICard
            title="Retard de paiement"
            value={kpis?.totalOverdue || 0}
            variant={kpis?.totalOverdue && kpis.totalOverdue > 0 ? "navy" : "default"}
            formatAsPrice
            icon={AlertTriangle}
          />
          <FinanceKPICard
            title="Taux de recouvrement"
            value={`${(kpis?.recoveryRate || 0).toFixed(0)}%`}
            variant="gold"
            icon={Percent}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les méthodes</SelectItem>
                  {Object.entries(METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Paiements ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(p.payment_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {getClientName(p)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.inscription?.code || "-"}
                        </TableCell>
                        <TableCell>
                          {METHOD_LABELS[p.payment_method] || p.payment_method}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(Number(p.amount))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {p.reference || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_STYLES[p.status] || "bg-muted"}>
                            {STATUS_LABELS[p.status] || p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucun paiement enregistré
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
