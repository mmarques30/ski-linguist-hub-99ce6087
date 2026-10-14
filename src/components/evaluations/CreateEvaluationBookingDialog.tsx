import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  LANGUAGE_LABELS,
  PROFESSION_LABELS,
  PROFESSIONS,
} from "@/lib/evaluation-utils";
import {
  SKI_DISCIPLINE_LABELS,
  SKI_DISCIPLINES,
  skiFieldsMissing,
} from "@/lib/test-candidate-fields";
import { useCreateFormateurEvaluationBooking } from "@/hooks/useTestEvaluations";

const PROFESSION_OPTIONS = [...PROFESSIONS, "autre"] as const;
const SPONSOR_OPTIONS = [
  { value: "esf", label: "ESF" },
  { value: "ecole_ski", label: "École de ski (hors ESF)" },
  { value: "dsf", label: "DSF" },
] as const;
const PAYMENT_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "school_invoice", label: "Facture école" },
  { value: "stripe", label: "Carte (Stripe)" },
  { value: "bank_transfer", label: "Virement" },
  { value: "invoice", label: "Facture individuelle" },
] as const;

const LANGUAGE_OPTIONS = Object.keys(LANGUAGE_LABELS).filter((k) => k !== "all");

function todayLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIsoLocal(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export interface CreateEvaluationBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Staff : choix du formateur. Formateur : null (auto). */
  requireInstructorPick: boolean;
  onCreated: (bookingId: string) => void;
}

export function CreateEvaluationBookingDialog({
  open,
  onOpenChange,
  requireInstructorPick,
  onCreated,
}: CreateEvaluationBookingDialogProps) {
  const create = useCreateFormateurEvaluationBooking();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("moniteur");
  const [professionAutre, setProfessionAutre] = useState("");
  const [skiSchoolId, setSkiSchoolId] = useState("");
  const [carteSyndicale, setCarteSyndicale] = useState("");
  const [skiDiscipline, setSkiDiscipline] = useState("");
  const [trainingCycle, setTrainingCycle] = useState("");
  const [language, setLanguage] = useState("anglais");
  const [testDate, setTestDate] = useState(todayLocalDate);
  const [testTime, setTestTime] = useState("10:00");
  const [sponsorType, setSponsorType] = useState<"esf" | "ecole_ski" | "dsf">("esf");
  const [paymentType, setPaymentType] = useState("pending");
  const [instructorId, setInstructorId] = useState("");

  const schoolsQuery = useQuery({
    queryKey: ["ski-schools-for-test"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_ski_schools_for_test");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const instructorsQuery = useQuery({
    queryKey: ["instructors-for-eval-create"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, first_name, last_name")
        .eq("is_active", true)
        .order("last_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && requireInstructorPick,
  });

  const skiMissing = skiFieldsMissing(profession, skiDiscipline, trainingCycle);
  const canSubmit = useMemo(() => {
    if (!name.trim() || !email.trim() || !phone.trim()) return false;
    if (!profession || !skiSchoolId || !language || !testDate) return false;
    if (profession === "autre" && !professionAutre.trim()) return false;
    if (skiMissing) return false;
    if (requireInstructorPick && !instructorId) return false;
    return true;
  }, [
    name,
    email,
    phone,
    profession,
    skiSchoolId,
    language,
    testDate,
    professionAutre,
    skiMissing,
    requireInstructorPick,
    instructorId,
  ]);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setProfession("moniteur");
    setProfessionAutre("");
    setSkiSchoolId("");
    setCarteSyndicale("");
    setSkiDiscipline("");
    setTrainingCycle("");
    setLanguage("anglais");
    setTestDate(todayLocalDate());
    setTestTime("10:00");
    setSponsorType("esf");
    setPaymentType("pending");
    setInstructorId("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      const bookingId = await create.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        profession,
        professionAutre: professionAutre.trim(),
        skiSchoolId,
        carteSyndicale: carteSyndicale.trim(),
        skiDiscipline,
        trainingCycle: trainingCycle.trim(),
        language,
        datetimeIso: toIsoLocal(testDate, testTime || "10:00"),
        sponsorType,
        paymentType,
        instructorId: requireInstructorPick ? instructorId : null,
      });
      toast.success("Évaluation créée", {
        description: "Vous pouvez saisir les notes.",
      });
      onOpenChange(false);
      reset();
      onCreated(bookingId);
    } catch (err) {
      toast.error("Création impossible", {
        description: err instanceof Error ? err.message : "Erreur",
      });
    }
  };

  const schools = schoolsQuery.data ?? [];
  const instructors = instructorsQuery.data ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle évaluation
          </DialogTitle>
          <DialogDescription>
            Crée le dossier candidat et ouvre la saisie (test déjà réalisé).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {requireInstructorPick && (
            <div className="space-y-2">
              <Label>Formateur·rice *</Label>
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {[i.first_name, i.last_name].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="eval-name">Nom et prénom *</Label>
              <Input
                id="eval-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-email">E-mail *</Label>
              <Input
                id="eval-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-phone">Téléphone *</Label>
              <Input
                id="eval-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Profession *</Label>
              <Select value={profession} onValueChange={setProfession}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFESSION_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === "autre" ? "Autre" : PROFESSION_LABELS[p] || p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Langue *</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((code) => (
                    <SelectItem key={code} value={code}>
                      {LANGUAGE_LABELS[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {profession === "autre" && (
            <div className="space-y-2">
              <Label htmlFor="eval-prof-autre">Précisez *</Label>
              <Input
                id="eval-prof-autre"
                value={professionAutre}
                onChange={(e) => setProfessionAutre(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>École / entreprise *</Label>
            <Select value={skiSchoolId} onValueChange={setSkiSchoolId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {profession === "moniteur" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discipline *</Label>
                <Select value={skiDiscipline} onValueChange={setSkiDiscipline}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alpin / nordique" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKI_DISCIPLINES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {SKI_DISCIPLINE_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eval-cycle">Cycle de formation *</Label>
                <Input
                  id="eval-cycle"
                  value={trainingCycle}
                  onChange={(e) => setTrainingCycle(e.target.value)}
                  placeholder="ex. TE1, MF1…"
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="eval-carte">Carte syndicale</Label>
                <Input
                  id="eval-carte"
                  value={carteSyndicale}
                  onChange={(e) => setCarteSyndicale(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="eval-date">Date du test *</Label>
              <Input
                id="eval-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-time">Heure</Label>
              <Input
                id="eval-time"
                type="time"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Commanditaire *</Label>
              <Select
                value={sponsorType}
                onValueChange={(v) => setSponsorType(v as typeof sponsorType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPONSOR_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paiement</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || create.isPending}>
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Créer et saisir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
