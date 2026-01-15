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
    payment_type: "integral" as "integral" | "acompte" | "solde",
    amount_ht: 0,
    tva_rate: 0,
    notes: "",
  });

  const createInvoice = useCreateInvoice();

  // Buscar inscrições disponíveis
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

      // Buscar nomes dos alunos para cada inscrição
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
            student_name: student ? `${student.first_name} ${student.last_name}` : "Cliente desconhecido",
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

  // Resetar formulário quando o diálogo abre
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
        payment_type: "integral",
        amount_ht: 0,
        tva_rate: 0,
        notes: "",
      });
    }
  }, [open]);

  // Atualizar taxa de IVA baseado no tipo de fatura
  useEffect(() => {
    if (formData.invoice_type === "formation") {
      setFormData((prev) => ({ ...prev, tva_rate: 0 }));
    } else {
      setFormData((prev) => ({ ...prev, tva_rate: 20 }));
    }
  }, [formData.invoice_type]);

  // Atualizar valor quando inscrição é selecionada
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
      toast.error("O valor HT deve ser maior que 0");
      return;
    }

    try {
      await createInvoice.mutateAsync({
        inscription_id: formData.inscription_id || undefined,
        invoice_date: formData.invoice_date,
        invoice_type: formData.invoice_type,
        amount_ht: formData.amount_ht,
        notes: formData.notes || undefined,
      });

      toast.success("Fatura criada com sucesso");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar fatura:", error);
      toast.error("Erro ao criar a fatura");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Fatura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Inscrição */}
          <div className="space-y-2">
            <Label htmlFor="inscription">Inscrição (opcional)</Label>
            <Select
              value={formData.inscription_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, inscription_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar uma inscrição..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma inscrição</SelectItem>
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

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Data da fatura</Label>
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
              <Label htmlFor="due_date">Data de vencimento</Label>
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

          {/* Tipo e Tipo de Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de fatura</Label>
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
                  <SelectItem value="formation">Formação (IVA 0%)</SelectItem>
                  <SelectItem value="test">Teste (IVA 20%)</SelectItem>
                  <SelectItem value="soustraitance">Subcontratação (IVA 20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de pagamento</Label>
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
                  <SelectItem value="integral">Integral</SelectItem>
                  <SelectItem value="acompte">Adiantamento</SelectItem>
                  <SelectItem value="solde">Saldo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount_ht">Valor HT (€)</Label>
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
              <Label htmlFor="tva_rate">IVA (%)</Label>
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
              <Label>Valor TTC (€)</Label>
              <Input
                type="text"
                value={calculatedTTC.toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              placeholder="Notas ou observações..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar fatura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
