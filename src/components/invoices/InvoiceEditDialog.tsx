import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface InvoiceEditDialogProps {
  invoice: InvoiceWithInscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceEditDialog({ invoice, open, onOpenChange }: InvoiceEditDialogProps) {
  const updateInvoice = useUpdateInvoice();
  
  const [formData, setFormData] = useState({
    invoice_date: "",
    due_date: "",
    invoice_type: "formation" as "formation" | "test" | "soustraitance",
    amount_ht: 0,
    tva_rate: 0,
    status: "draft" as "draft" | "sent" | "paid" | "cancelled",
    payment_method: "",
    payment_date: "",
    notes: "",
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_date: invoice.invoice_date || "",
        due_date: invoice.due_date || "",
        invoice_type: invoice.invoice_type,
        amount_ht: invoice.amount_ht || 0,
        tva_rate: invoice.tva_rate || 0,
        status: invoice.status,
        payment_method: invoice.payment_method || "",
        payment_date: invoice.payment_date || "",
        notes: invoice.notes || "",
      });
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        invoice_type: formData.invoice_type,
        amount_ht: formData.amount_ht,
        tva_rate: formData.tva_rate,
        status: formData.status,
        payment_method: formData.payment_method || null,
        payment_date: formData.payment_date || null,
        notes: formData.notes || null,
      });
      toast.success("Facture mise à jour avec succès");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de la facture");
    }
  };

  const calculatedTTC = formData.amount_ht * (1 + formData.tva_rate / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Modifier la facture {invoice?.invoice_number}
          </DialogTitle>
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

          {/* Type et Statut */}
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "sent" | "paid" | "cancelled") =>
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

          {/* Paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Méthode de paiement</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Date de paiement</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) =>
                  setFormData({ ...formData, payment_date: e.target.value })
                }
              />
            </div>
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

          {/* Client Info (read-only) */}
          {invoice?.inscription && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Informations client (lecture seule)</h4>
              <p className="text-sm">
                <strong>Client:</strong> {invoice.inscription.student_name}
              </p>
              {invoice.inscription.student_company && (
                <p className="text-sm">
                  <strong>Entreprise:</strong> {invoice.inscription.student_company}
                </p>
              )}
              {invoice.inscription.student_address && (
                <p className="text-sm">
                  <strong>Adresse:</strong> {invoice.inscription.student_address}, {invoice.inscription.student_postal_code} {invoice.inscription.student_city}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateInvoice.isPending}>
              {updateInvoice.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
