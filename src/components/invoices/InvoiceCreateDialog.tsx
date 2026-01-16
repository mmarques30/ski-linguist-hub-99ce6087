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
import { useCreateInvoice } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InscriptionOption {
  id: string;
  code: string | null;
  student_name: string;
  language: string;
  start_date: string;
  price: number | null;
}

export function InvoiceCreateDialog({ open, onOpenChange }: InvoiceCreateDialogProps) {
  const [formData, setFormData] = useState({
    inscription_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    invoice_type: "formation" as "formation" | "test" | "soustraitance",
    client_type: "stagiaire" as "stagiaire" | "ecole_ski" | "dsf" | "autre",
    payment_type: "integral" as "integral" | "acompte" | "solde",
    amount_ht: 0,
    tva_rate: 0,
    notes: "",
  });

  const createInvoice = useCreateInvoice();

  // Récupérer les inscriptions disponibles
  const { data: inscriptions, isLoading: loadingInscriptions } = useQuery({
    queryKey: ["inscriptions-for-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions")
        .select(`
          id,
          code,
          language,
          start_date,
          price,
          student_id
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Récupérer les noms des stagiaires pour chaque inscription
      const inscriptionsWithStudents = await Promise.all(
        (data || []).map(async (inscription) => {
          const { data: student } = await supabase
            .from("students")
            .select("first_name, last_name")
            .eq("id", inscription.student_id)
            .maybeSingle();

          return {
            id: inscription.id,
            code: inscription.code,
            student_name: student ? `${student.first_name} ${student.last_name}` : "Client inconnu",
            language: inscription.language,
            start_date: inscription.start_date,
            price: inscription.price,
          } as InscriptionOption;
        })
      );

      return inscriptionsWithStudents;
    },
    enabled: open,
  });

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (open) {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      setFormData({
        inscription_id: "",
        invoice_date: today.toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        invoice_type: "formation",
        client_type: "stagiaire",
        payment_type: "integral",
        amount_ht: 0,
        tva_rate: 0,
        notes: "",
      });
    }
  }, [open]);

  // Mettre à jour le taux de TVA selon le type de facture
  useEffect(() => {
    if (formData.invoice_type === "formation") {
      setFormData((prev) => ({ ...prev, tva_rate: 0 }));
    } else {
      setFormData((prev) => ({ ...prev, tva_rate: 20 }));
    }
  }, [formData.invoice_type]);

  // Mettre à jour le montant lors de la sélection d'une inscription
  useEffect(() => {
    if (formData.inscription_id && inscriptions) {
      const selectedInscription = inscriptions.find(
        (i) => i.id === formData.inscription_id
      );
      if (selectedInscription?.price) {
        setFormData((prev) => ({
          ...prev,
          amount_ht: selectedInscription.price || 0,
        }));
      }
    }
  }, [formData.inscription_id, inscriptions]);

  const calculatedTTC = formData.amount_ht * (1 + formData.tva_rate / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount_ht <= 0) {
      toast.error("Le montant HT doit être supérieur à 0");
      return;
    }

    try {
      const result = await createInvoice.mutateAsync({
        inscription_id: formData.inscription_id || undefined,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || undefined,
        invoice_type: formData.invoice_type,
        client_type: formData.client_type,
        payment_type: formData.payment_type,
        amount_ht: formData.amount_ht,
        tva_rate: formData.tva_rate,
        notes: formData.notes || undefined,
      });

      toast.success(`Facture ${result.invoice_number} créée avec succès`);
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la création de la facture:", error);
      toast.error("Erreur lors de la création de la facture");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle facture</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection d'inscription */}
          <div className="space-y-2">
            <Label htmlFor="inscription">Inscription (optionnel)</Label>
            <Select
              value={formData.inscription_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, inscription_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une inscription..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucune inscription</SelectItem>
                {loadingInscriptions ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  inscriptions?.map((inscription) => (
                    <SelectItem key={inscription.id} value={inscription.id}>
                      {inscription.student_name} - {inscription.language} (
                      {formatDate(inscription.start_date)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Date de facture</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, invoice_date: e.target.value }))
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
                  setFormData((prev) => ({ ...prev, due_date: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Type, Client et type de paiement */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type de facture</Label>
              <Select
                value={formData.invoice_type}
                onValueChange={(value: "formation" | "test" | "soustraitance") =>
                  setFormData((prev) => ({ ...prev, invoice_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formation">Formation (TVA 0%)</SelectItem>
                  <SelectItem value="test">Test (TVA 20%)</SelectItem>
                  <SelectItem value="soustraitance">Sous-traitance (TVA 20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type de client</Label>
              <Select
                value={formData.client_type}
                onValueChange={(value: "stagiaire" | "ecole_ski" | "dsf" | "autre") =>
                  setFormData((prev) => ({ ...prev, client_type: value }))
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
              <Label>Type de paiement</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value: "integral" | "acompte" | "solde") =>
                  setFormData((prev) => ({ ...prev, payment_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="integral">Intégral</SelectItem>
                  <SelectItem value="acompte">Acompte</SelectItem>
                  <SelectItem value="solde">Solde</SelectItem>
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
                  setFormData((prev) => ({
                    ...prev,
                    amount_ht: parseFloat(e.target.value) || 0,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tva_rate">TVA (%)</Label>
              <Input
                id="tva_rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.tva_rate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tva_rate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Montant TTC (€)</Label>
              <Input
                type="text"
                value={calculatedTTC.toFixed(2)}
                disabled
                className="bg-muted"
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
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              placeholder="Notes ou observations..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Créer la facture
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
