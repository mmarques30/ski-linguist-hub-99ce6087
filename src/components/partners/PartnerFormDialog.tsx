import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePartner, useUpdatePartner, type Partner } from "@/hooks/usePartners";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  partner?: Partner | null;
}

const TYPES = [
  { value: "esf", label: "ESF" },
  { value: "ecole_ski", label: "École de ski (non-ESF)" },
  { value: "hotel", label: "Hôtel" },
  { value: "remontees_mecaniques", label: "Remontées mécaniques" },
  { value: "office_tourisme", label: "Office de tourisme" },
  { value: "autre", label: "Autre" },
];

const STATUSES = [
  { value: "prospect", label: "Prospect" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
];

export function PartnerFormDialog({ open, onOpenChange, partner }: Props) {
  const create = useCreatePartner();
  const update = useUpdatePartner();
  const isEdit = !!partner;

  const [form, setForm] = useState({
    name: "",
    type: "esf",
    station: "",
    address: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    status: "prospect",
    notes: "",
  });

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name,
        type: partner.type,
        station: partner.station || "",
        address: partner.address || "",
        contact_name: partner.contact_name || "",
        contact_email: partner.contact_email || "",
        contact_phone: partner.contact_phone || "",
        status: partner.status,
        notes: partner.notes || "",
      });
    } else {
      setForm({ name: "", type: "esf", station: "", address: "", contact_name: "", contact_email: "", contact_phone: "", status: "prospect", notes: "" });
    }
  }, [partner, open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (isEdit) {
      await update.mutateAsync({ id: partner.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le partenaire" : "Nouveau partenaire"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Station</Label>
              <Input value={form.station} onChange={(e) => set("station", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
