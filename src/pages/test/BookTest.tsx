import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ClipboardList } from "lucide-react";
import { IconChip, SurfaceCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import {
  PROFESSION_LABELS,
  PROFESSIONS,
} from "@/lib/evaluation-utils";
import {
  SKI_DISCIPLINE_LABELS,
  SKI_DISCIPLINES,
  skiFieldsMissing,
} from "@/lib/test-candidate-fields";
import fliLogo from "@/assets/fli-logo.png";

const PROFESSION_OPTIONS = [...PROFESSIONS, "autre"] as const;

export default function BookTest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [professionAutre, setProfessionAutre] = useState("");
  const [skiSchoolId, setSkiSchoolId] = useState("");
  const [carteSyndicale, setCarteSyndicale] = useState("");
  const [skiDiscipline, setSkiDiscipline] = useState("");
  const [trainingCycle, setTrainingCycle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const schoolsQuery = useQuery({
    queryKey: ["ski-schools-for-test"],
    queryFn: async () => {
      const { data, error: rpcError } = await supabase.rpc(
        "list_ski_schools_for_test"
      );
      if (rpcError) throw rpcError;
      return data ?? [];
    },
  });

  const isMoniteur = profession === "moniteur";
  const skiMissing = skiFieldsMissing(profession, skiDiscipline, trainingCycle);
  const canSubmit = useMemo(() => {
    if (!name.trim() || !email.trim() || !phone.trim()) return false;
    if (!profession || !skiSchoolId) return false;
    if (profession === "autre" && !professionAutre.trim()) return false;
    if (skiMissing) return false;
    return true;
  }, [name, email, phone, profession, skiSchoolId, professionAutre, skiMissing]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("submit_test_booking_candidate", {
      p_name: name.trim(),
      p_email: email.trim(),
      p_phone: phone.trim(),
      p_profession: profession,
      p_profession_autre: professionAutre.trim(),
      p_ski_school_id: skiSchoolId,
      p_carte_syndicale: carteSyndicale.trim(),
      p_ski_discipline: skiDiscipline,
      p_training_cycle: trainingCycle.trim(),
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setDone(true);
  };

  const schools = schoolsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-page))] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-xl animate-fade-up space-y-5">
        <div className="flex justify-center">
          <img src={fliLogo} alt="France Langues International" className="h-12 sm:h-14" />
        </div>

        {done ? (
          <SurfaceCard accent="chart-3" bodyClassName="p-5 sm:p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <IconChip icon={CheckCircle} tone="teal" size="lg" />
              <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                Demande enregistrée
              </h1>
              <p className="text-sm text-muted-foreground">
                Demande enregistrée. FLI vous confirmera le créneau.
              </p>
            </div>
          </SurfaceCard>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <SurfaceCard
              title="Réservation de test"
              description="Identité du candidat. Si vous êtes moniteur de ski, discipline et cycle de formation sont obligatoires — ils figurent ensuite sur le compte-rendu."
              icon={ClipboardList}
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom et prénom</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profession</Label>
                  <Select value={profession} onValueChange={setProfession}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESSION_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value === "autre"
                            ? "Autre"
                            : PROFESSION_LABELS[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {profession === "autre" && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                    <Label htmlFor="profession-autre">Précisez</Label>
                    <Input
                      id="profession-autre"
                      value={professionAutre}
                      onChange={(e) => setProfessionAutre(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>École de ski</Label>
                  {schoolsQuery.isLoading ? (
                    <Skeleton className="h-11 w-full rounded-[var(--radius)]" />
                  ) : (
                    <Select value={skiSchoolId} onValueChange={setSkiSchoolId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choisir une école" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {schoolsQuery.isError && (
                    <p className="text-sm text-destructive">
                      La liste des écoles n&apos;a pas pu être chargée. Merci de réessayer ou de
                      contacter FLI.
                    </p>
                  )}
                  {!schoolsQuery.isLoading && !schoolsQuery.isError && schools.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucune école de ski disponible pour le moment.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carte">N° carte syndicale (si ESF)</Label>
                  <Input
                    id="carte"
                    value={carteSyndicale}
                    onChange={(e) => setCarteSyndicale(e.target.value)}
                    className="h-11"
                  />
                </div>
                {isMoniteur && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-4 rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-sunken))] p-4">
                    <div className="space-y-3">
                      <Label>Discipline</Label>
                      <RadioGroup
                        value={skiDiscipline}
                        onValueChange={setSkiDiscipline}
                        className="grid gap-2 xs:grid-cols-2"
                      >
                        {SKI_DISCIPLINES.map((value) => (
                          <div
                            key={value}
                            className="rounded-[var(--radius)] border border-border bg-card"
                          >
                            <Label
                              htmlFor={`disc-${value}`}
                              className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2.5 font-normal"
                            >
                              <RadioGroupItem value={value} id={`disc-${value}`} />
                              {SKI_DISCIPLINE_LABELS[value]}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cycle">Cycle de formation</Label>
                      <Input
                        id="cycle"
                        value={trainingCycle}
                        onChange={(e) => setTrainingCycle(e.target.value)}
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </SurfaceCard>

            <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-[hsl(var(--surface-raised))]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <Button
                type="submit"
                className="h-12 w-full text-base"
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
