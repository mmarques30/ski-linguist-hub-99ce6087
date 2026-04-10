import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useCreateInstructor, useUpdateInstructor, type Instructor } from "@/hooks/useInstructors";

const LANGUAGES = ["Anglais", "Portugais", "Russe", "Néerlandais", "Français", "Espagnol"];
const TAX_STATUSES = [
  { value: "auto_entrepreneur", label: "Auto-entrepreneur" },
  { value: "salarie", label: "Salarié" },
  { value: "portage", label: "Portage salarial" },
  { value: "eurl", label: "EURL / SASU" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
}

export function InstructorFormDialog({ open, onOpenChange, instructor }: Props) {
  const create = useCreateInstructor();
  const update = useUpdateInstructor();
  const isEdit = !!instructor;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    languages: [] as string[],
    specialties: [] as string[],
    hourly_rate: "",
    tax_status: "auto_entrepreneur",
    siret: "",
    bio: "",
    city: "",
    geographic_zones: [] as string[],
  });

  useEffect(() => {
    if (instructor) {
      setForm({
        first_name: instructor.first_name || "",
        last_name: instructor.last_name || "",
        email: instructor.email || "",
        phone: instructor.phone || "",
        languages: instructor.languages || [],
        specialties: instructor.specialties || [],
        hourly_rate: instructor.hourly_rate?.toString() || "",
        tax_status: instructor.tax_status || "auto_entrepreneur",
        siret: instructor.siret || "",
        bio: instructor.bio || "",
        city: instructor.city || "",
        geographic_zones: instructor.geographic_zones || [],
      });
    } else {
      setForm({
        first_name: "", last_name: "", email: "", phone: "",
        languages: [], specialties: [], hourly_rate: "",
        tax_status: "auto_entrepreneur", siret: "", bio: "",
        city: "", geographic_zones: [],
      });
    }
  }, [instructor, open]);

  const toggleLanguage = (lang: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSubmit = async () => {
    const payload: any = {
      ...form,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
    };

    if (isEdit) {
      await update.mutateAsync({ id: instructor!.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le formateur" : "Nouveau formateur"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Langues enseignées</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {LANGUAGES.map((l) => (
                <Button
                  key={l}
                  type="button"
                  size="sm"
                  variant={form.languages.includes(l) ? "default" : "outline"}
                  onClick={() => toggleLanguage(l)}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tarif horaire (€)</Label>
              <Input
                type="number"
                value={form.hourly_rate}
                onChange={(e) => setForm((f) => ({ ...f, hourly_rate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Statut fiscal</Label>
              <Select
                value={form.tax_status}
                onValueChange={(v) => setForm((f) => ({ ...f, tax_status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAX_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>SIRET</Label>
              <Input
                value={form.siret}
                onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.last_name || create.isPending || update.isPending}
            >
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
