import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFormationCost } from "@/hooks/useFinancialDashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId?: string;
}

const costTypes = [
  { value: 'formateur', label: 'Formateur' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'deplacement', label: 'Déplacement' },
  { value: 'salle', label: 'Salle' },
  { value: 'materiel', label: 'Matériel' },
  { value: 'restauration', label: 'Restauration' },
  { value: 'autre', label: 'Autre' },
];

const tvaRates = [
  { value: '0', label: '0%' },
  { value: '5.5', label: '5.5%' },
  { value: '10', label: '10%' },
  { value: '20', label: '20%' },
];

export function AddCostDialog({ open, onOpenChange, inscriptionId }: AddCostDialogProps) {
  const { toast } = useToast();
  const createCost = useCreateFormationCost();
  
  const [costType, setCostType] = useState<string>('');
  const [montantHT, setMontantHT] = useState('');
  const [tvaRate, setTvaRate] = useState('0');
  const [instructorId, setInstructorId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [dateCout, setDateCout] = useState('');
  const [selectedInscription, setSelectedInscription] = useState(inscriptionId || '');

  const { data: inscriptions } = useQuery({
    queryKey: ['inscriptions-for-costs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inscriptions_complete')
        .select('id, code, student_name, language, start_date')
        .order('start_date', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const { data: instructors } = useQuery({
    queryKey: ['instructors-for-costs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('instructors')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name');
      return data || [];
    },
  });

  const montantTVA = Number(montantHT) * (Number(tvaRate) / 100);
  const montantTTC = Number(montantHT) + montantTVA;

  const handleSubmit = async () => {
    if (!costType || !montantHT || !selectedInscription) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
      });
      return;
    }

    try {
      await createCost.mutateAsync({
        inscription_id: selectedInscription,
        cost_type: costType as any,
        montant_ht: Number(montantHT),
        montant_tva: montantTVA,
        montant_ttc: montantTTC,
        instructor_id: costType === 'formateur' && instructorId ? instructorId : null,
        description: description || null,
        date_cout: dateCout || null,
        document_url: null,
      });

      toast({
        title: "Succès",
        description: "Coût ajouté avec succès",
      });

      // Reset form
      setCostType('');
      setMontantHT('');
      setTvaRate('0');
      setInstructorId('');
      setDescription('');
      setDateCout('');
      setSelectedInscription(inscriptionId || '');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un coût</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Formation *</Label>
            <Select value={selectedInscription} onValueChange={setSelectedInscription}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une formation" />
              </SelectTrigger>
              <SelectContent>
                {inscriptions?.map((insc) => (
                  <SelectItem key={insc.id} value={insc.id!}>
                    {insc.code} - {insc.student_name} ({insc.language})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type de coût *</Label>
            <Select value={costType} onValueChange={setCostType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {costTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {costType === 'formateur' && (
            <div className="space-y-2">
              <Label>Formateur</Label>
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.first_name} {inst.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant HT * (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={montantHT}
                onChange={(e) => setMontantHT(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>TVA</Label>
              <Select value={tvaRate} onValueChange={setTvaRate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tvaRates.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between">
              <span>TVA:</span>
              <span>{montantTVA.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total TTC:</span>
              <span>{montantTTC.toFixed(2)} €</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={dateCout}
              onChange={(e) => setDateCout(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={createCost.isPending}>
            {createCost.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
