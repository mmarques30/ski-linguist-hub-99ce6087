import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateLead, useUpdateLead, LEAD_SOURCES, Lead } from "@/hooks/useLeads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadFormDialog({ open, onOpenChange, lead }: Props) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const isEdit = !!lead;

  const [form, setForm] = useState({
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    company: "",
    source: "autre",
    partner_id: "",
    language_interest: "",
    estimated_students: 1,
    estimated_revenue: 0,
    next_action: "",
    next_action_date: "",
    notes: "",
  });

  useEffect(() => {
    if (lead) {
      setForm({
        contact_name: lead.contact_name || "",
        contact_email: lead.contact_email || "",
        contact_phone: lead.contact_phone || "",
        company: lead.company || "",
        source: lead.source || "autre",
        partner_id: lead.partner_id || "",
        language_interest: lead.language_interest || "",
        estimated_students: lead.estimated_students || 1,
        estimated_revenue: lead.estimated_revenue || 0,
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date || "",
        notes: lead.notes || "",
      });
    } else {
      setForm({
        contact_name: "", contact_email: "", contact_phone: "", company: "",
        source: "autre", partner_id: "", language_interest: "",
        estimated_students: 1, estimated_revenue: 0,
        next_action: "", next_action_date: "", notes: "",
      });
    }
  }, [lead, open]);

  const { data: partners = [] } = useQuery({
    queryKey: ["partners-select"],
    queryFn: async () => {
      const { data } = await supabase.from("partners").select("id, name").eq("status", "actif");
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact_name.trim()) return;

    const payload = {
      ...form,
      partner_id: form.partner_id || null,
      estimated_students: Number(form.estimated_students),
      estimated_revenue: Number(form.estimated_revenue),
      next_action_date: form.next_action_date || null,
    };

    try {
      if (isEdit && lead) {
        await updateLead.mutateAsync({ id: lead.id, ...payload });
        toast.success("Lead mis à jour");
      } else {
        await createLead.mutateAsync(payload as any);
        toast.success("Lead créé");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le lead" : "Nouveau lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom du contact *</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
            </div>
            <div>
              <Label>Entreprise</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Partenaire</Label>
              <Select value={form.partner_id} onValueChange={(v) => setForm({ ...form, partner_id: v })}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Langue</Label>
              <Select value={form.language_interest} onValueChange={(v) => setForm({ ...form, language_interest: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="francais">Français</SelectItem>
                  <SelectItem value="anglais">Anglais</SelectItem>
                  <SelectItem value="espagnol">Espagnol</SelectItem>
                  <SelectItem value="portugais">Portugais</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stagiaires estimés</Label>
              <Input type="number" min={1} value={form.estimated_students} onChange={(e) => setForm({ ...form, estimated_students: +e.target.value })} />
            </div>
            <div>
              <Label>CA estimé (€)</Label>
              <Input type="number" min={0} value={form.estimated_revenue} onChange={(e) => setForm({ ...form, estimated_revenue: +e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prochaine action</Label>
              <Input value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
            </div>
            <div>
              <Label>Date prochaine action</Label>
              <Input type="date" value={form.next_action_date} onChange={(e) => setForm({ ...form, next_action_date: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={createLead.isPending || updateLead.isPending}>
              {isEdit ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
