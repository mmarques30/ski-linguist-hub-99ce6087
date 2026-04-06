import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreatePartnerContact } from "@/hooks/usePartners";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  partnerId: string;
}

export function ContactFormDialog({ open, onOpenChange, partnerId }: Props) {
  const create = useCreatePartnerContact();
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "", is_primary: false });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await create.mutateAsync({
      partner_id: partnerId,
      name: form.name,
      role: form.role || null,
      email: form.email || null,
      phone: form.phone || null,
      is_primary: form.is_primary,
    });
    onOpenChange(false);
    setForm({ name: "", role: "", email: "", phone: "", is_primary: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nouveau contact</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="ex: Directeur" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={form.is_primary} onCheckedChange={(v) => set("is_primary", !!v)} id="primary" />
            <Label htmlFor="primary">Contact principal</Label>
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
