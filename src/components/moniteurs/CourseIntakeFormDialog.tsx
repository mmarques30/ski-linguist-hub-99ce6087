import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useCreateCourseIntake, useUpdateCourseIntake, CourseIntake, INTAKE_STATUSES,
} from "@/hooks/useCourseIntakes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHostingSchoolPartners } from "@/hooks/useSkiSchoolPartnerMatching";
import { toast } from "sonner";
import { AlertCircle, Users } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intake?: CourseIntake | null;
}

const LANGUAGES = ["Anglais", "Français", "Espagnol", "Portugais", "Italien", "Allemand", "Russe", "Chinois", "Néerlandais"];

export function CourseIntakeFormDialog({ open, onOpenChange, intake }: Props) {
  const createIntake = useCreateCourseIntake();
  const updateIntake = useUpdateCourseIntake();
  const isEdit = !!intake;

  const [form, setForm] = useState({
    hosting_partner_id: "",
    start_date: "",
    end_date: "",
    language: "Anglais",
    location: "",
    modality: "presentiel",
    open_to_other_schools: false,
    max_places: "",
    status: "brouillon" as CourseIntake["status"],
    season_id: "",
    notes: "",
  });

  useEffect(() => {
    if (intake) {
      setForm({
        hosting_partner_id: intake.hosting_partner_id,
        start_date: intake.start_date,
        end_date: intake.end_date,
        language: intake.language,
        location: intake.location,
        modality: intake.modality || "presentiel",
        open_to_other_schools: intake.open_to_other_schools,
        max_places: intake.max_places ? String(intake.max_places) : "",
        status: intake.status,
        season_id: intake.season_id || "",
        notes: intake.notes || "",
      });
    } else {
      setForm({
        hosting_partner_id: "", start_date: "", end_date: "",
        language: "Anglais", location: "", modality: "presentiel",
        open_to_other_schools: false, max_places: "", status: "brouillon",
        season_id: "", notes: "",
      });
    }
  }, [intake, open]);

  const { data: partners = [] } = useHostingSchoolPartners();

  const { data: currentSeason } = useQuery({
    queryKey: ["current-season"],
    queryFn: async () => {
      const { data } = await supabase.from("seasons").select("id, name").eq("is_current", true).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!isEdit && currentSeason && !form.season_id) {
      setForm((f) => ({ ...f, season_id: currentSeason.id }));
    }
  }, [currentSeason, isEdit, form.season_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hosting_partner_id || !form.start_date || !form.end_date || !form.location) {
      toast.error("Remplissez les champs obligatoires");
      return;
    }

    const payload = {
      hosting_partner_id: form.hosting_partner_id,
      start_date: form.start_date,
      end_date: form.end_date,
      language: form.language,
      location: form.location,
      modality: form.modality,
      target_audience: "moniteur_ski" as const,
      open_to_other_schools: form.open_to_other_schools,
      max_places: form.max_places ? Number(form.max_places) : null,
      status: form.status,
      season_id: form.season_id || null,
      notes: form.notes || null,
    };

    try {
      if (isEdit && intake) {
        await updateIntake.mutateAsync({ id: intake.id, ...payload });
        toast.success("Date de formation mise à jour");
      } else {
        await createIntake.mutateAsync(payload);
        toast.success("Date de formation créée");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const selectedPartner = partners.find((p) => p.id === form.hosting_partner_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la date" : "Nouvelle date de formation"}</DialogTitle>
          <DialogDescription>
            Date fermée avec une école de ski — public cible : moniteurs de ski
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>École hôte (partenaire) *</Label>
            <Select value={form.hosting_partner_id} onValueChange={(v) => setForm({ ...form, hosting_partner_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner l'école" /></SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}{p.station ? ` — ${p.station}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date début *</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <Label>Date fin *</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
            </div>
            <div>
              <Label>Langue *</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lieu / Station *</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="ex. Courchevel" required />
            </div>
            <div>
              <Label>Places max</Label>
              <Input type="number" min={1} value={form.max_places} onChange={(e) => setForm({ ...form, max_places: e.target.value })} />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CourseIntake["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTAKE_STATUSES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="open-other" className="text-base font-medium">
                  Ouvrir aux moniteurs d'autres écoles ?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Les moniteurs peuvent préférer une autre station. Si oui, tous les moniteurs actifs de la base seront informés.
                  {selectedPartner && !form.open_to_other_schools && (
                    <span className="block mt-1 font-medium text-foreground">
                      Non → seuls les moniteurs de {selectedPartner.name} seront contactés.
                    </span>
                  )}
                </p>
              </div>
              <Switch
                id="open-other"
                checked={form.open_to_other_schools}
                onCheckedChange={(v) => setForm({ ...form, open_to_other_schools: v })}
              />
            </div>
            {form.open_to_other_schools && (
              <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>L'email sera envoyé à <strong>toute la base moniteurs active</strong>, toutes écoles confondues.</span>
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={createIntake.isPending || updateIntake.isPending}>
              {isEdit ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
