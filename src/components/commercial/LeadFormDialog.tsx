import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useCreateLead, useUpdateLead, useConvertLead, useDeleteLead,
  LEAD_SOURCES, LEAD_STATUSES, EXPANSION_CHANNELS, Lead, ExpansionChannel,
} from "@/hooks/useLeads";
import { useSkiMonitors } from "@/hooks/useSkiMonitors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus } from "lucide-react";
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
  const deleteLead = useDeleteLead();
  const isEdit = !!lead;
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    status: "nouveau",
    assigned_to: "",
    loss_reason: "",
    project_start: "",
    project_end: "",
    ski_monitor_id: "",
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
        status: lead.status || "nouveau",
        assigned_to: lead.assigned_to || "",
        loss_reason: lead.loss_reason || "",
        project_start: lead.project_start || "",
        project_end: lead.project_end || "",
        ski_monitor_id: lead.ski_monitor_id || "",
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
        status: "nouveau", assigned_to: "", loss_reason: "",
        project_start: "", project_end: "", ski_monitor_id: "",
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

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-profiles-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("is_active", true)
        .order("full_name");
      return data || [];
    },
  });

  const { data: skiMonitors = [] } = useSkiMonitors({ status: "active" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact_name.trim()) return;

    if (form.status === "perdu" && !form.loss_reason.trim()) {
      toast.error("Motif de perte requis pour un lead perdu");
      return;
    }

    const payload = {
      ...form,
      partner_id: form.partner_id || null,
      assigned_to: form.assigned_to || null,
      loss_reason: form.loss_reason.trim() || null,
      project_start: form.project_start || null,
      project_end: form.project_end || null,
      ski_monitor_id: form.ski_monitor_id || null,
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

  const handleDelete = async () => {
    if (!lead) return;
    try {
      await deleteLead.mutateAsync(lead.id);
      toast.success("Lead supprimé");
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de suppression");
    }
  };

  return (
    <>
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

            {form.expansion_channel === "moniteur_ski" && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <Label>Moniteur ski lié</Label>
                <Select
                  value={form.ski_monitor_id || "none"}
                  onValueChange={(v) => setForm({ ...form, ski_monitor_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {skiMonitors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} — {m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Select
                    value={form.partner_id || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, partner_id: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigné à</Label>
                <Select
                  value={form.assigned_to || "none"}
                  onValueChange={(v) => setForm({ ...form, assigned_to: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name || s.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.status === "perdu" || isEdit) && (
              <div>
                <Label>
                  Motif de perte {form.status === "perdu" ? "*" : "(optionnel)"}
                </Label>
                <Textarea
                  value={form.loss_reason}
                  onChange={(e) => setForm({ ...form, loss_reason: e.target.value })}
                  rows={2}
                  placeholder="Ex. budget insuffisant, concurrence, pas de réponse…"
                  required={form.status === "perdu"}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Début du projet</Label>
                <Input
                  type="date"
                  value={form.project_start}
                  onChange={(e) => setForm({ ...form, project_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Fin du projet</Label>
                <Input
                  type="date"
                  value={form.project_end}
                  onChange={(e) => setForm({ ...form, project_end: e.target.value })}
                />
              </div>
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
                    <SelectItem value="portugais">Portugais brésilien</SelectItem>
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
              <div className="flex gap-2">
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
                {isEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                    disabled={deleteLead.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lead ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le lead « {lead?.contact_name} » sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
