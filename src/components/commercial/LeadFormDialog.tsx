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
import {
  useCreateLead, useUpdateLead, useConvertLead,
  LEAD_SOURCES, EXPANSION_CHANNELS, Lead, ExpansionChannel,
} from "@/hooks/useLeads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  defaultChannel?: ExpansionChannel;
}

export function LeadFormDialog({ open, onOpenChange, lead, defaultChannel = "cpf" }: Props) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const convertLead = useConvertLead();
  const isEdit = !!lead;

  const [form, setForm] = useState({
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    company: "",
    source: "autre",
    expansion_channel: defaultChannel as ExpansionChannel,
    partner_id: "",
    language_interest: "",
    estimated_students: 1,
    estimated_revenue: 0,
    cpf_amount_available: 0,
    course_interest: "",
    project_name: "",
    expected_volume: 1,
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
        expansion_channel: lead.expansion_channel || "cpf",
        partner_id: lead.partner_id || "",
        language_interest: lead.language_interest || "",
        estimated_students: lead.estimated_students || 1,
        estimated_revenue: lead.estimated_revenue || 0,
        cpf_amount_available: lead.cpf_amount_available || 0,
        course_interest: lead.course_interest || "",
        project_name: lead.project_name || "",
        expected_volume: lead.expected_volume || 1,
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date || "",
        notes: lead.notes || "",
      });
    } else {
      setForm({
        contact_name: "", contact_email: "", contact_phone: "", company: "",
        source: "autre", expansion_channel: defaultChannel,
        partner_id: "", language_interest: "",
        estimated_students: 1, estimated_revenue: 0,
        cpf_amount_available: 0, course_interest: "",
        project_name: "", expected_volume: 1,
        next_action: "", next_action_date: "", notes: "",
      });
    }
  }, [lead, open, defaultChannel]);

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
      cpf_amount_available: form.cpf_amount_available ? Number(form.cpf_amount_available) : null,
      expected_volume: form.expected_volume ? Number(form.expected_volume) : null,
      course_interest: form.course_interest || null,
      project_name: form.project_name || null,
      next_action_date: form.next_action_date || null,
    };

    try {
      if (isEdit && lead) {
        await updateLead.mutateAsync({ id: lead.id, ...payload });
        toast.success("Lead mis à jour");
      } else {
        await createLead.mutateAsync(payload as Parameters<typeof createLead.mutateAsync>[0]);
        toast.success("Lead créé");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleConvert = async () => {
    if (!lead) return;
    try {
      const result = await convertLead.mutateAsync(lead);
      toast.success(`Inscription ${result.inscriptionCode} créée`);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de conversion");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le lead" : "Nouveau lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Canal d'expansion</Label>
            <Select
              value={form.expansion_channel}
              onValueChange={(v) => setForm({ ...form, expansion_channel: v as ExpansionChannel })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPANSION_CHANNELS.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom du contact *</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
            </div>
            <div>
              <Label>{form.expansion_channel === "b2b" ? "Entreprise *" : "Entreprise"}</Label>
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

          {form.expansion_channel === "cpf" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/30">
              <div>
                <Label>Montant CPF disponible (€)</Label>
                <Input type="number" min={0} value={form.cpf_amount_available} onChange={(e) => setForm({ ...form, cpf_amount_available: +e.target.value })} />
              </div>
              <div>
                <Label>Formation souhaitée</Label>
                <Input value={form.course_interest} onChange={(e) => setForm({ ...form, course_interest: e.target.value })} />
              </div>
            </div>
          )}

          {form.expansion_channel === "dsf" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/30">
              <div>
                <Label>Nom du projet</Label>
                <Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
              </div>
              <div>
                <Label>Volume prévu (stagiaires)</Label>
                <Input type="number" min={1} value={form.expected_volume} onChange={(e) => setForm({ ...form, expected_volume: +e.target.value })} />
              </div>
            </div>
          )}

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
            {(form.expansion_channel === "b2b" || form.expansion_channel === "dsf") && (
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
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Langue</Label>
              <Select value={form.language_interest} onValueChange={(v) => setForm({ ...form, language_interest: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anglais">Anglais</SelectItem>
                  <SelectItem value="francais">Français</SelectItem>
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
            <Label>Notes / Historique</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          {isEdit && lead?.inscription_id && (
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link to={`/inscriptions/${lead.inscription_id}`}>Voir l'inscription liée →</Link>
            </Button>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <div>
              {isEdit && lead && lead.status !== "converti" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleConvert}
                  disabled={convertLead.isPending || !lead.contact_email}
                >
                  {convertLead.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Convertir en inscription
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={createLead.isPending || updateLead.isPending}>
                {isEdit ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
