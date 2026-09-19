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
import {
  INSTRUCTOR_LANGUAGES,
  displayLanguageLabel,
  languagesInclude,
  normalizeInstructorLanguage,
} from "@/lib/taught-languages";

export const TAX_STATUSES = [
  { value: "auto_entrepreneur", label: "Auto-entrepreneur" },
  { value: "salarie", label: "Salarié" },
  { value: "portage", label: "Portage salarial" },
  { value: "eurl", label: "EURL / SASU" },
];

const STATUS_OPTIONS = [
  { value: "actif", label: "Actif·ve" },
  { value: "inactif", label: "Inactif·ve" },
  { value: "candidat", label: "Candidat·e" },
];

const AVAILABILITY_OPTIONS = [
  { value: "disponible", label: "Disponible" },
  { value: "occupe", label: "Occupé·e" },
  { value: "indisponible", label: "Indisponible" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
}

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  languages: string[];
  specialties: string[];
  hourly_rate: string;
  tax_status: string;
  siret: string;
  bio: string;
  city: string;
  address: string;
  postal_code: string;
  pays: string;
  civilite: string;
  geographic_zones: string[];
  status: string;
  availability_status: string;
  specialty_details: string;
  status_notes: string;
  statut_administratif: string;
  identifiant_etranger: string;
  assujetti_tva: string;
  consentement_temoignage: string;
  consentement_photo: string;
  date_naissance: string;
  formulaire_2026: boolean;
  vigilance_attestation_url: string;
  vigilance_attestation_received_at: string;
  vigilance_attestation_expires_at: string;
};

const emptyForm = (): FormState => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  languages: [],
  specialties: [],
  hourly_rate: "",
  tax_status: "auto_entrepreneur",
  siret: "",
  bio: "",
  city: "",
  address: "",
  postal_code: "",
  pays: "",
  civilite: "",
  geographic_zones: [],
  status: "actif",
  availability_status: "disponible",
  specialty_details: "",
  status_notes: "",
  statut_administratif: "",
  identifiant_etranger: "",
  assujetti_tva: "",
  consentement_temoignage: "",
  consentement_photo: "",
  date_naissance: "",
  formulaire_2026: false,
  vigilance_attestation_url: "",
  vigilance_attestation_received_at: "",
  vigilance_attestation_expires_at: "",
});

export function InstructorFormDialog({ open, onOpenChange, instructor }: Props) {
  const create = useCreateInstructor();
  const update = useUpdateInstructor();
  const isEdit = !!instructor;

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (instructor) {
      setForm({
        first_name: instructor.first_name || "",
        last_name: instructor.last_name || "",
        email: instructor.email || "",
        phone: instructor.phone || "",
        languages: (instructor.languages || []).map(normalizeInstructorLanguage),
        specialties: instructor.specialties || [],
        hourly_rate: instructor.hourly_rate?.toString() || "",
        tax_status: instructor.tax_status || "auto_entrepreneur",
        siret: instructor.siret || "",
        bio: instructor.bio || "",
        city: instructor.city || "",
        address: instructor.address || "",
        postal_code: instructor.postal_code || "",
        pays: instructor.pays || "",
        civilite: instructor.civilite || "",
        geographic_zones: instructor.geographic_zones || [],
        status: instructor.status || "actif",
        availability_status: instructor.availability_status || "disponible",
        specialty_details: instructor.specialty_details || "",
        status_notes: instructor.status_notes || "",
        statut_administratif: instructor.statut_administratif || "",
        identifiant_etranger: instructor.identifiant_etranger || "",
        assujetti_tva:
          instructor.assujetti_tva === true
            ? "oui"
            : instructor.assujetti_tva === false
              ? "non"
              : "",
        consentement_temoignage: instructor.consentement_temoignage || "",
        consentement_photo: instructor.consentement_photo || "",
        date_naissance: instructor.date_naissance || "",
        formulaire_2026: instructor.formulaire_2026 === true,
        vigilance_attestation_url: instructor.vigilance_attestation_url || "",
        vigilance_attestation_received_at: instructor.vigilance_attestation_received_at || "",
        vigilance_attestation_expires_at: instructor.vigilance_attestation_expires_at || "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [instructor, open]);

  const toggleLanguage = (lang: string) => {
    const canonical = normalizeInstructorLanguage(lang);
    setForm((f) => ({
      ...f,
      languages: languagesInclude(f.languages, canonical)
        ? f.languages.filter((l) => normalizeInstructorLanguage(l) !== canonical)
        : [...f.languages, canonical],
    }));
  };

  const handleSubmit = async () => {
    const payload: Partial<Instructor> = {
      first_name: form.first_name || null,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      languages: form.languages.map(normalizeInstructorLanguage),
      specialties: form.specialties,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      tax_status: form.tax_status || null,
      siret: form.siret || null,
      bio: form.bio || null,
      city: form.city || null,
      address: form.address || null,
      postal_code: form.postal_code || null,
      pays: form.pays || null,
      civilite: form.civilite || null,
      geographic_zones: form.geographic_zones,
      status: form.status,
      is_active: form.status === "actif",
      availability_status: form.availability_status || null,
      specialty_details: form.specialty_details || null,
      status_notes: form.status_notes || null,
      statut_administratif: form.statut_administratif || null,
      identifiant_etranger: form.identifiant_etranger || null,
      assujetti_tva:
        form.assujetti_tva === "oui"
          ? true
          : form.assujetti_tva === "non"
            ? false
            : null,
      consentement_temoignage: form.consentement_temoignage || null,
      consentement_photo: form.consentement_photo || null,
      date_naissance: form.date_naissance || null,
      formulaire_2026: form.formulaire_2026,
      vigilance_attestation_url: form.vigilance_attestation_url || null,
      vigilance_attestation_received_at: form.vigilance_attestation_received_at || null,
      vigilance_attestation_expires_at: form.vigilance_attestation_expires_at || null,
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
              <Label>Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disponibilité</Label>
              <Select
                value={form.availability_status}
                onValueChange={(v) => setForm((f) => ({ ...f, availability_status: v }))}
                disabled={form.status !== "actif"}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Civilité</Label>
              <Input
                value={form.civilite}
                onChange={(e) => setForm((f) => ({ ...f, civilite: e.target.value }))}
                placeholder="Madame / Monsieur"
              />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={form.date_naissance}
                onChange={(e) => setForm((f) => ({ ...f, date_naissance: e.target.value }))}
              />
            </div>
          </div>

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
              {INSTRUCTOR_LANGUAGES.map((l) => (
                <Button
                  key={l}
                  type="button"
                  size="sm"
                  variant={languagesInclude(form.languages, l) ? "default" : "outline"}
                  onClick={() => toggleLanguage(l)}
                >
                  {displayLanguageLabel(l)}
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
              <Label>Identifiant fiscal étranger</Label>
              <Input
                value={form.identifiant_etranger}
                onChange={(e) => setForm((f) => ({ ...f, identifiant_etranger: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assujetti TVA</Label>
              <Select
                value={form.assujetti_tva || "unset"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, assujetti_tva: v === "unset" ? "" : v }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Non renseigné</SelectItem>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut administratif</Label>
              <Input
                value={form.statut_administratif}
                onChange={(e) => setForm((f) => ({ ...f, statut_administratif: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Code postal</Label>
              <Input
                value={form.postal_code}
                onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div>
              <Label>Pays</Label>
              <Input
                value={form.pays}
                onChange={(e) => setForm((f) => ({ ...f, pays: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Spécialités / détails</Label>
            <Textarea
              value={form.specialty_details}
              onChange={(e) => setForm((f) => ({ ...f, specialty_details: e.target.value }))}
              rows={2}
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <Label>Notes de statut</Label>
            <Textarea
              value={form.status_notes}
              onChange={(e) => setForm((f) => ({ ...f, status_notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Consentement témoignage</Label>
              <Select
                value={form.consentement_temoignage || "unset"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    consentement_temoignage: v === "unset" ? "" : v,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Non renseigné</SelectItem>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="oui avec relecture">Oui avec relecture</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Consentement photo</Label>
              <Select
                value={form.consentement_photo || "unset"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    consentement_photo: v === "unset" ? "" : v,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Non renseigné</SelectItem>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="oui avec relecture">Oui avec relecture</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.formulaire_2026}
              onChange={(e) =>
                setForm((f) => ({ ...f, formulaire_2026: e.target.checked }))
              }
            />
            Formulaire saison 2026 reçu
          </label>
          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-sm font-medium">Attestation de vigilance</p>
            <div>
              <Label>URL du document</Label>
              <Input
                type="url"
                placeholder="https://…"
                value={form.vigilance_attestation_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vigilance_attestation_url: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reçue le</Label>
                <Input
                  type="date"
                  value={form.vigilance_attestation_received_at}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vigilance_attestation_received_at: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Expire le</Label>
                <Input
                  type="date"
                  value={form.vigilance_attestation_expires_at}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vigilance_attestation_expires_at: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
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
