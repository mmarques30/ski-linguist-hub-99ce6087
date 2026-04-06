import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePartnerContract } from "@/hooks/usePartners";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  partnerId: string;
}

export function ContractFormDialog({ open, onOpenChange, partnerId }: Props) {
  const create = useCreatePartnerContract();
  const [form, setForm] = useState({
    contract_type: "saisonnier",
    negotiated_rate: "",
    volume_commitment: "",
    payment_terms: "30j",
    signed_date: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    await create.mutateAsync({
      partner_id: partnerId,
      contract_type: form.contract_type,
      negotiated_rate: form.negotiated_rate ? Number(form.negotiated_rate) : null,
      volume_commitment: form.volume_commitment || null,
      payment_terms: form.payment_terms,
      signed_date: form.signed_date || null,
      notes: form.notes || null,
    });
    onOpenChange(false);
    setForm({ contract_type: "saisonnier", negotiated_rate: "", volume_commitment: "", payment_terms: "30j", signed_date: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nouveau contrat</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.contract_type} onValueChange={(v) => set("contract_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annuel">Annuel</SelectItem>
                  <SelectItem value="saisonnier">Saisonnier</SelectItem>
                  <SelectItem value="ponctuel">Ponctuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Select value={form.payment_terms} onValueChange={(v) => set("payment_terms", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30j">30 jours</SelectItem>
                  <SelectItem value="60j">60 jours</SelectItem>
                  <SelectItem value="fin_de_saison">Fin de saison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarif négocié (€/h)</Label>
              <Input type="number" value={form.negotiated_rate} onChange={(e) => set("negotiated_rate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Volume engagé</Label>
              <Input value={form.volume_commitment} onChange={(e) => set("volume_commitment", e.target.value)} placeholder="ex: 200h ou 15 stagiaires" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date de signature</Label>
            <Input type="date" value={form.signed_date} onChange={(e) => set("signed_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
