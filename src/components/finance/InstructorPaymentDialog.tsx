import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateInstructorPayment } from "@/hooks/useFinancialDashboard";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InstructorPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: {
    id: string;
    first_name: string | null;
    last_name: string;
    a_payer: number;
  };
}

export function InstructorPaymentDialog({ open, onOpenChange, instructor }: InstructorPaymentDialogProps) {
  const { toast } = useToast();
  const createPayment = useCreateInstructorPayment();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const firstOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  
  const [montant, setMontant] = useState(instructor?.a_payer?.toString() || '');
  const [periodeDebut, setPeriodeDebut] = useState(firstOfMonth);
  const [periodeFin, setPeriodeFin] = useState(today);
  const [datePaiement, setDatePaiement] = useState(today);
  const [moyenPaiement, setMoyenPaiement] = useState<'virement' | 'cheque' | 'especes'>('virement');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!instructor || !montant || !periodeDebut || !periodeFin) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
      });
      return;
    }

    try {
      await createPayment.mutateAsync({
        instructor_id: instructor.id,
        montant: Number(montant),
        periode_debut: periodeDebut,
        periode_fin: periodeFin,
        date_paiement: datePaiement,
        moyen_paiement: moyenPaiement,
        reference_paiement: reference || null,
        statut: 'paye',
        notes: notes || null,
      });

      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  if (!instructor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement formateur</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{instructor.first_name} {instructor.last_name}</p>
            <p className="text-sm text-muted-foreground">
              Montant dû: <span className="font-medium text-foreground">{instructor.a_payer.toFixed(2)} €</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Période du *</Label>
              <Input
                type="date"
                value={periodeDebut}
                onChange={(e) => setPeriodeDebut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Au *</Label>
              <Input
                type="date"
                value={periodeFin}
                onChange={(e) => setPeriodeFin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Montant payé * (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moyen de paiement</Label>
              <Select value={moyenPaiement} onValueChange={(v) => setMoyenPaiement(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <Input
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Référence</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° virement ou chèque..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={createPayment.isPending}>
            {createPayment.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
