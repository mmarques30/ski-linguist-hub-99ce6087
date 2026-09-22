import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateInvoice, InvoiceWithInscription } from "@/hooks/useInvoices";
import {
  syncInvoicePayments,
  type InvoicePaymentLineInput,
} from "@/hooks/usePayments";
import { supabase } from "@/integrations/supabase/client";
import {
  PAYMENT_METHODS,
  CHEQUE_STATUSES,
  canonicalPaymentMethod,
  HISTORICAL_PAYMENT_METHOD,
} from "@/lib/payment-methods";
import { resolveInvoiceClientName } from "@/lib/invoice-client-name";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useQueryClient } from "@tanstack/react-query";

interface InvoiceEditDialogProps {
  invoice: InvoiceWithInscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditablePaymentLine = InvoicePaymentLineInput & { key: string };

function newLineKey() {
  return `new-${crypto.randomUUID()}`;
}

function emptyPaymentLine(
  defaults?: Partial<EditablePaymentLine>
): EditablePaymentLine {
  return {
    key: newLineKey(),
    amount: 0,
    payment_method: "virement",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_type: "partial",
    cheque_status: "recu",
    ...defaults,
  };
}

export function InvoiceEditDialog({ invoice, open, onOpenChange }: InvoiceEditDialogProps) {
  const updateInvoice = useUpdateInvoice();
  const queryClient = useQueryClient();
  const { confirm, dialog: confirmDialog } = useConfirmAction();
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    invoice_date: "",
    due_date: "",
    invoice_type: "formation" as "formation" | "test" | "soustraitance",
    client_type: "stagiaire" as "stagiaire" | "ecole_ski" | "dsf" | "autre",
    amount_ht: 0,
    tva_rate: 0,
    status: "draft" as "draft" | "sent" | "paid" | "cancelled" | "a_verifier",
    notes: "",
  });

  const [paymentLines, setPaymentLines] = useState<EditablePaymentLine[]>([]);

  const clientName = useMemo(
    () => (invoice ? resolveInvoiceClientName(invoice) : "-"),
    [invoice]
  );

  useEffect(() => {
    if (!invoice || !open) return;

    setFormData({
      invoice_date: invoice.invoice_date || "",
      due_date: invoice.due_date || "",
      invoice_type: invoice.invoice_type,
      client_type: invoice.client_type || "stagiaire",
      amount_ht: invoice.amount_ht || 0,
      tva_rate: invoice.tva_rate || 0,
      status: invoice.status,
      notes: invoice.notes || "",
    });

    let cancelled = false;
    setLoadingPayments(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("payments")
          .select(
            "id, amount, payment_method, payment_date, payment_type, cheque_status"
          )
          .eq("invoice_id", invoice.id)
          .order("payment_date", { ascending: true });
        if (error) throw error;
        if (cancelled) return;

        if (data && data.length > 0) {
          setPaymentLines(
            data.map((row) => ({
              key: row.id,
              id: row.id,
              amount: Number(row.amount) || 0,
              payment_method:
                canonicalPaymentMethod(row.payment_method) || row.payment_method,
              payment_date: row.payment_date || "",
              payment_type:
                row.payment_type === "acompte" ||
                row.payment_type === "adiantamento"
                  ? "acompte"
                  : row.payment_type === "total" ||
                      row.payment_type === "integral" ||
                      row.payment_type === "solde" ||
                      row.payment_type === "saldo"
                    ? "total"
                    : "partial",
              cheque_status: row.cheque_status || "recu",
            }))
          );
        } else if (invoice.payment_method || invoice.payment_date) {
          setPaymentLines([
            emptyPaymentLine({
              amount: invoice.amount_ttc || invoice.amount_ht || 0,
              payment_method:
                canonicalPaymentMethod(invoice.payment_method) ||
                invoice.payment_method ||
                "virement",
              payment_date:
                invoice.payment_date || new Date().toISOString().slice(0, 10),
              payment_type: "total",
            }),
          ]);
        } else {
          setPaymentLines([]);
        }
      } catch {
        if (!cancelled) {
          toast.error("Impossible de charger les paiements de la facture");
          setPaymentLines([]);
        }
      } finally {
        if (!cancelled) setLoadingPayments(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoice, open]);

  const calculatedTTC = formData.amount_ht * (1 + formData.tva_rate / 100);
  const paymentsTotal = paymentLines.reduce(
    (sum, line) => sum + (Number(line.amount) || 0),
    0
  );

  const updateLine = (key: string, patch: Partial<EditablePaymentLine>) => {
    setPaymentLines((lines) =>
      lines.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  };

  const removeLine = (key: string) => {
    setPaymentLines((lines) => lines.filter((line) => line.key !== key));
  };

  const addLine = () => {
    const remaining = Math.max(
      0,
      Math.round((calculatedTTC - paymentsTotal) * 100) / 100
    );
    setPaymentLines((lines) => [
      ...lines,
      emptyPaymentLine({
        amount: remaining || 0,
        payment_type: lines.length === 0 ? "acompte" : "total",
      }),
    ]);
  };

  const persistInvoice = async () => {
    if (!invoice) return;

    const validLines = paymentLines.filter(
      (line) =>
        Number(line.amount) > 0 && line.payment_method && line.payment_date
    );

    const sortedByDate = [...validLines].sort((a, b) =>
      a.payment_date.localeCompare(b.payment_date)
    );
    const lastLine = sortedByDate[sortedByDate.length - 1];
    const summaryMethod = lastLine
      ? lastLine.payment_method === HISTORICAL_PAYMENT_METHOD
        ? HISTORICAL_PAYMENT_METHOD
        : canonicalPaymentMethod(lastLine.payment_method)
      : null;
    const summaryDate = lastLine?.payment_date || null;

    setSaving(true);
    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        invoice_type: formData.invoice_type,
        client_type: formData.client_type,
        amount_ht: formData.amount_ht,
        tva_rate: formData.tva_rate,
        status: formData.status,
        payment_method: summaryMethod,
        payment_date: summaryDate,
        notes: formData.notes || null,
      });

      await syncInvoicePayments({
        invoiceId: invoice.id,
        inscriptionId: invoice.inscription_id,
        payerName:
          clientName !== "-"
            ? clientName
            : invoice.inscription?.student_name ?? null,
        lines: validLines.map((line) => ({
          id: line.id,
          amount: Number(line.amount),
          payment_method:
            line.payment_method === HISTORICAL_PAYMENT_METHOD
              ? HISTORICAL_PAYMENT_METHOD
              : canonicalPaymentMethod(line.payment_method) || line.payment_method,
          payment_date: line.payment_date,
          payment_type: line.payment_type,
          cheque_status: line.cheque_status,
        })),
      });

      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["payment-kpis"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });

      toast.success("Facture mise à jour avec succès");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la mise à jour de la facture");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const incomplete = paymentLines.some(
      (line) =>
        Number(line.amount) > 0 &&
        (!line.payment_method || !line.payment_date)
    );
    if (incomplete) {
      toast.error("Chaque paiement nécessite un moyen et une date");
      return;
    }

    if (formData.status === "paid") {
      const valid = paymentLines.filter((line) => Number(line.amount) > 0);
      if (valid.length === 0) {
        toast.error("Une facture payée exige au moins une ligne de paiement");
        return;
      }
      if (Math.abs(paymentsTotal - calculatedTTC) > 0.05) {
        toast.error(
          `Le total des paiements (${paymentsTotal.toFixed(2)} €) doit égaler le TTC (${calculatedTTC.toFixed(2)} €)`
        );
        return;
      }
    }

    confirm({
      title: "Enregistrer les modifications ?",
      description: `La facture ${invoice.invoice_number} sera mise à jour.`,
      actionLabel: "Enregistrer",
      run: () => persistInvoice(),
    });
  };

  const isPending = updateInvoice.isPending || saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Modifier la facture {invoice?.invoice_number}
          </DialogTitle>
          {clientName !== "-" && (
            <p className="text-sm text-muted-foreground pt-1">
              Client : <span className="font-medium text-foreground">{clientName}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Date de facture</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Type, Client et Statut */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_type">Type de facture</Label>
              <Select
                value={formData.invoice_type}
                onValueChange={(value: "formation" | "test" | "soustraitance") =>
                  setFormData({ ...formData, invoice_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formation">Formation</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="soustraitance">Sous-traitance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_type">Type de client</Label>
              <Select
                value={formData.client_type}
                onValueChange={(value: "stagiaire" | "ecole_ski" | "dsf" | "autre") =>
                  setFormData({ ...formData, client_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stagiaire">Stagiaire</SelectItem>
                  <SelectItem value="ecole_ski">École de ski</SelectItem>
                  <SelectItem value="dsf">DSF</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "sent" | "paid" | "cancelled" | "a_verifier") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                  <SelectItem value="a_verifier">À vérifier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount_ht">Montant HT (€)</Label>
              <Input
                id="amount_ht"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_ht}
                onChange={(e) =>
                  setFormData({ ...formData, amount_ht: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tva_rate">TVA (%)</Label>
              <Input
                id="tva_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tva_rate}
                onChange={(e) =>
                  setFormData({ ...formData, tva_rate: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Montant TTC (€)</Label>
              <Input
                type="text"
                value={new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(calculatedTTC)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Paiements (plusieurs lignes) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label>Paiements</Label>
                <p className="text-xs text-muted-foreground">
                  Acompte, solde, chèques… Total saisi :{" "}
                  <span className="tabular font-medium text-foreground">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(paymentsTotal)}
                  </span>
                  {" / "}
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(calculatedTTC)}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter un paiement
              </Button>
            </div>

            {loadingPayments ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des paiements…
              </div>
            ) : paymentLines.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-4">
                Aucun paiement enregistré. Ajoutez une ou plusieurs lignes (ex. acompte
                150 € puis chèque 600 €).
              </p>
            ) : (
              <ul className="space-y-3">
                {paymentLines.map((line, index) => (
                  <li
                    key={line.key}
                    className="rounded-md border border-border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Paiement {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label={`Supprimer le paiement ${index + 1}`}
                        onClick={() => removeLine(line.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Montant (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.amount || ""}
                          onChange={(e) =>
                            updateLine(line.key, {
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={line.payment_date}
                          onChange={(e) =>
                            updateLine(line.key, { payment_date: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Moyen</Label>
                        <Select
                          value={line.payment_method}
                          onValueChange={(value) =>
                            updateLine(line.key, { payment_method: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="…" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                            {line.payment_method === HISTORICAL_PAYMENT_METHOD && (
                              <SelectItem value={HISTORICAL_PAYMENT_METHOD}>
                                Non renseigné (historique)
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={line.payment_type}
                          onValueChange={(value: "acompte" | "partial" | "total") =>
                            updateLine(line.key, { payment_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acompte">Acompte</SelectItem>
                            <SelectItem value="partial">Partiel</SelectItem>
                            <SelectItem value="total">Solde / total</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {line.payment_method === "cheque" && (
                      <div className="space-y-1.5 max-w-xs">
                        <Label className="text-xs">Statut du chèque</Label>
                        <Select
                          value={line.cheque_status || "recu"}
                          onValueChange={(value) =>
                            updateLine(line.key, { cheque_status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHEQUE_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notes internes..."
              rows={3}
            />
          </div>

          {/* Client Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Informations client
            </h4>
            <p className="text-sm">
              <strong>Nom / prénom :</strong> {clientName}
            </p>
            {invoice?.inscription?.student_company && (
              <p className="text-sm">
                <strong>Entreprise :</strong> {invoice.inscription.student_company}
              </p>
            )}
            {invoice?.inscription?.student_address && (
              <p className="text-sm">
                <strong>Adresse :</strong> {invoice.inscription.student_address},{" "}
                {invoice.inscription.student_postal_code}{" "}
                {invoice.inscription.student_city}
              </p>
            )}
            {!invoice?.inscription && clientName !== "-" && (
              <p className="text-xs text-muted-foreground">
                Nom lu depuis les notes (facture sans inscription liée).
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || loadingPayments}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
