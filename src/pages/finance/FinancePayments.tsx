import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePayments, usePaymentKPIs, useCreatePayment } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
  CHEQUE_STATUSES,
  paymentMethodLabel,
  chequeStatusLabel,
} from "@/lib/payment-methods";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { DollarSign, Clock, AlertTriangle, Percent, Plus, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import {
  CardList,
  CardListItem,
  FilterBar,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
  toneForStatus,
  type PillTone,
} from "@/components/ui-kit";

const STATUS_LABELS = PAYMENT_STATUS_LABELS;

/** Teintes des statuts propres aux paiements, en complément de `toneForStatus`. */
const PAYMENT_STATUS_TONES: Record<string, PillTone> = {
  echoue: "danger",
  rembourse: "info",
};

const paymentStatusTone = (status: string): PillTone =>
  PAYMENT_STATUS_TONES[status] ?? toneForStatus(status);

const PAYER_LABELS: Record<string, string> = {
  stagiaire: "Stagiaire",
  ecole: "École de ski",
  organisme: "Organisme",
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
  const { data: kpis, isLoading: loadingKpis } = usePaymentKPIs(startDate, endDate);
  const createPayment = useCreatePayment();
  const { data: invoices = [] } = useInvoices();

  const [form, setForm] = useState({
    amount: "",
    payment_method: "virement",
    payment_date: format(today, "yyyy-MM-dd"),
    status: "recu",
    payer_type: "stagiaire",
    payer_name: "",
    invoice_id: "",
    cheque_status: "recu",
    reference: "",
    notes: "",
  });
  const selectedInvoice = invoices.find((inv) => inv.id === form.invoice_id);

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!form.invoice_id) {
      toast.error("Rattachez le paiement à une facture");
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
        invoice_id: form.invoice_id,
        inscription_id: selectedInvoice?.inscription_id ?? null,
        cheque_status: form.payment_method === "cheque" ? form.cheque_status : null,
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
        invoice_id: "",
        cheque_status: "recu",
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

  const methodLine = (p: typeof payments[0]) =>
    `${paymentMethodLabel(p.payment_method)}${
      p.payment_method === "cheque" && p.cheque_status
        ? ` · ${chequeStatusLabel(p.cheque_status)}`
        : ""
    }`;

  const activeFilters = [
    ...(statusFilter !== "all"
      ? [
          {
            key: "status",
            label: STATUS_LABELS[statusFilter] || statusFilter,
            onRemove: () => setStatusFilter("all"),
          },
        ]
      : []),
    ...(methodFilter !== "all"
      ? [
          {
            key: "method",
            label: paymentMethodLabel(methodFilter),
            onRemove: () => setMethodFilter("all"),
          },
        ]
      : []),
  ];

  const createDialog = (
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
          <div className="space-y-2">
            <Label>Facture</Label>
            <Select
              value={form.invoice_id}
              onValueChange={(v) => {
                const invoice = invoices.find((inv) => inv.id === v);
                setForm({
                  ...form,
                  invoice_id: v,
                  amount: form.amount || String(invoice?.amount_ttc || invoice?.amount_ht || ""),
                  payer_name: form.payer_name || invoice?.inscription?.student_name || "",
                });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Choisir une facture" /></SelectTrigger>
              <SelectContent>
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoice_number || inv.id.slice(0, 8)} · {inv.amount_ttc ?? inv.amount_ht} €
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedInvoice?.inscription_id && (
              <p className="text-xs text-muted-foreground">Inscription liée automatiquement</p>
            )}
          </div>
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
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
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
          {form.payment_method === "cheque" && (
            <div className="space-y-2">
              <Label>Statut du chèque</Label>
              <Select value={form.cheque_status} onValueChange={(v) => setForm({ ...form, cheque_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHEQUE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
  );

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Suivi des Paiements"
          description="Gestion centralisée de tous les encaissements"
          icon={Wallet}
          tone="teal"
          actions={editable ? createDialog : undefined}
        />

        {/* KPIs — chaque tuile filtre la liste ou ouvre les factures concernées. */}
        <StatTileGrid cols={4}>
          <StatTile
            label="Encaissé ce mois"
            value={formatPrice(kpis?.totalReceived || 0)}
            icon={DollarSign}
            tone="teal"
            loading={loadingKpis}
            onClick={() => setStatusFilter("recu")}
          />
          <StatTile
            label="En attente"
            value={formatPrice(kpis?.totalPending || 0)}
            icon={Clock}
            tone="gold"
            loading={loadingKpis}
            onClick={() => setStatusFilter("en_attente")}
          />
          <StatTile
            label="Retard de paiement"
            value={formatPrice(kpis?.totalOverdue || 0)}
            icon={AlertTriangle}
            tone={kpis?.totalOverdue && kpis.totalOverdue > 0 ? "rose" : "neutral"}
            loading={loadingKpis}
            to="/invoices?status=sent"
          />
          <StatTile
            label="Taux de recouvrement"
            value={`${(kpis?.recoveryRate || 0).toFixed(0)}%`}
            icon={Percent}
            tone="blue"
            loading={loadingKpis}
          />
        </StatTileGrid>

        {/* Payments Table */}
        <SurfaceCard
          title={`Paiements (${payments.length})`}
          description="Encaissements enregistrés, tous exercices confondus"
          toolbar={
            <FilterBar
              activeFilters={activeFilters}
              onClearAll={
                activeFilters.length > 0
                  ? () => {
                      setStatusFilter("all");
                      setMethodFilter("all");
                    }
                  : undefined
              }
              filters={
                <>
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
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              }
            />
          }
          flush
        >
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : payments.length === 0 ? (
            <TableEmpty
              title="Aucun paiement enregistré"
              description="Aucun encaissement ne correspond aux filtres actifs."
              icon={Wallet}
            />
          ) : (
            <>
              <TableFrame className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Date</TableHeadCell>
                      <TableHeadCell>Facture</TableHeadCell>
                      <TableHeadCell>Client</TableHeadCell>
                      <TableHeadCell>Inscription</TableHeadCell>
                      <TableHeadCell>Méthode</TableHeadCell>
                      <TableHeadCell align="right">Montant</TableHeadCell>
                      <TableHeadCell>Référence</TableHeadCell>
                      <TableHeadCell>Statut</TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap tabular">
                          {format(new Date(p.payment_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.invoice_id && p.invoice?.invoice_number ? (
                            <Link
                              to={`/invoices?q=${encodeURIComponent(p.invoice.invoice_number)}`}
                              className="text-[hsl(var(--tint-blue-fg))] hover:underline"
                            >
                              {p.invoice.invoice_number}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {getClientName(p)}
                        </TableCell>
                        <TableCell className="font-mono text-xs" hideBelow="lg">
                          {p.inscription_id && p.inscription?.code ? (
                            <Link
                              to={`/inscriptions/${p.inscription_id}`}
                              className="text-[hsl(var(--tint-blue-fg))] hover:underline"
                            >
                              {p.inscription.code}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell hideBelow="lg">{methodLine(p)}</TableCell>
                        <TableCell align="right" className="font-medium tabular">
                          {formatPrice(Number(p.amount))}
                        </TableCell>
                        <TableCell
                          className="max-w-[120px] truncate text-xs text-muted-foreground"
                          hideBelow="xl"
                        >
                          {p.reference || "-"}
                        </TableCell>
                        <TableCell>
                          <StatusPill tone={paymentStatusTone(p.status)} size="sm">
                            {STATUS_LABELS[p.status] || p.status}
                          </StatusPill>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </TableFrame>

              <CardList className="md:hidden">
                {payments.map((p) => (
                  <CardListItem
                    key={p.id}
                    title={getClientName(p)}
                    subtitle={methodLine(p)}
                    meta={
                      <StatusPill tone={paymentStatusTone(p.status)} size="sm">
                        {STATUS_LABELS[p.status] || p.status}
                      </StatusPill>
                    }
                    fields={[
                      { label: "Date", value: format(new Date(p.payment_date), "dd/MM/yyyy") },
                      { label: "Montant", value: formatPrice(Number(p.amount)) },
                      {
                        label: "Facture",
                        value:
                          p.invoice_id && p.invoice?.invoice_number ? (
                            <Link
                              to={`/invoices?q=${encodeURIComponent(p.invoice.invoice_number)}`}
                              className="text-[hsl(var(--tint-blue-fg))] hover:underline"
                            >
                              {p.invoice.invoice_number}
                            </Link>
                          ) : (
                            "—"
                          ),
                      },
                      {
                        label: "Inscription",
                        value:
                          p.inscription_id && p.inscription?.code ? (
                            <Link
                              to={`/inscriptions/${p.inscription_id}`}
                              className="text-[hsl(var(--tint-blue-fg))] hover:underline"
                            >
                              {p.inscription.code}
                            </Link>
                          ) : (
                            "-"
                          ),
                      },
                      { label: "Référence", value: p.reference || "-" },
                    ]}
                  />
                ))}
              </CardList>
            </>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}
