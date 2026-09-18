import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Bell, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreatePayment,
  useCreatePaymentReminder,
  usePaymentReminders,
} from "@/hooks/usePayments";
import { useInscriptionClientAccess } from "@/hooks/useInscriptionClientAccess";
import {
  PAYMENT_METHODS,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTypeLabel,
} from "@/lib/payment-methods";

interface Props {
  inscriptionId: string;
  studentName?: string | null;
  editable?: boolean;
  price?: number | null;
}

const STATUS_OPTIONS = [
  { value: "recu", label: "Reçu" },
  { value: "en_attente", label: "En attente" },
  { value: "annule", label: "Annulé" },
];

/**
 * Paiements + relances pour l'onglet Financier (Vague B).
 */
export function InscriptionFinancialPayments({
  inscriptionId,
  studentName,
  editable = false,
  price,
}: Props) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useInscriptionClientAccess(inscriptionId);
  const { data: reminders = [], isLoading: remindersLoading } =
    usePaymentReminders(inscriptionId);
  const createPayment = useCreatePayment();
  const createReminder = useCreatePaymentReminder();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "virement",
    status: "recu",
    payment_type: "partial" as "acompte" | "partial" | "total",
    payer_name: studentName || "",
    notes: "",
  });

  const payments = data?.payments ?? [];
  const receivedTotal = payments
    .filter((p) => p.status === "recu" || p.status === "valide")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleCreate = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    try {
      await createPayment.mutateAsync({
        inscription_id: inscriptionId,
        amount,
        payment_method: form.payment_method,
        payment_date: form.payment_date,
        status: form.status,
        payment_type: form.payment_type,
        payer_type: "stagiaire",
        payer_name: form.payer_name || null,
        notes: form.notes || null,
      });
      queryClient.invalidateQueries({ queryKey: ["inscription-client-access", inscriptionId] });
      await refetch();
      toast.success("Paiement enregistré");
      setOpen(false);
      setForm((f) => ({ ...f, amount: "", notes: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    }
  };

  const handleReminder = async () => {
    try {
      await createReminder.mutateAsync({
        inscription_id: inscriptionId,
        reminder_type: "manuel",
        sent_via: "fiche",
        notes: "Relance enregistrée depuis la fiche inscription",
      });
      toast.success("Relance enregistrée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer la relance");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">
            Encaissé (paiements) :{" "}
            <span className="font-semibold text-foreground">
              {receivedTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
            {price != null && (
              <span className="text-muted-foreground">
                {" "}
                / prix {Number(price).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </span>
            )}
          </p>
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleReminder} disabled={createReminder.isPending}>
              {createReminder.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-1.5" />
              )}
              Enregistrer une relance
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Enregistrer un paiement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer un paiement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Montant (€)</Label>
                      <Input
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Méthode</Label>
                      <Select
                        value={form.payment_method}
                        onValueChange={(v) => setForm({ ...form, payment_method: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={form.payment_type}
                        onValueChange={(v) =>
                          setForm({
                            ...form,
                            payment_type: v as "acompte" | "partial" | "total",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acompte">Acompte</SelectItem>
                          <SelectItem value="partial">Partiel</SelectItem>
                          <SelectItem value="total">Total</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payeur</Label>
                    <Input
                      value={form.payer_name}
                      onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreate}
                    disabled={createPayment.isPending}
                  >
                    {createPayment.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : !payments.length ? (
            <p className="text-sm text-muted-foreground">
              Aucun paiement enregistré pour cette inscription.
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-lg border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{payment.amount} €</span>
                    <Badge variant="secondary">{paymentStatusLabel(payment.status)}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {paymentMethodLabel(payment.payment_method)} ·{" "}
                    {paymentTypeLabel(payment.payment_type)}
                    {payment.payment_date
                      ? ` · ${format(new Date(payment.payment_date), "dd/MM/yyyy")}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Relances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {remindersLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : !reminders.length ? (
            <p className="text-sm text-muted-foreground">
              Aucune relance enregistrée. Les e-mails automatiques partent via les crons
              une fois validés.
            </p>
          ) : (
            <div className="space-y-2">
              {reminders.map((r) => (
                <div key={r.id} className="rounded-lg border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{r.reminder_type}</span>
                    <Badge variant="outline">{r.sent_via}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {format(new Date(r.sent_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
