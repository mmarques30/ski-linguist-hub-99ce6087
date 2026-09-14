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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex justify-center">
          <img src={fliLogo} alt="France Langues International" className="h-14" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Réservation de test</CardTitle>
            <CardDescription>
              Identité du candidat. Si vous êtes moniteur de ski, discipline et cycle
              de formation sont obligatoires — ils figurent ensuite sur le compte-rendu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <p className="text-sm">
                Demande enregistrée. FLI vous confirmera le créneau.
              </p>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom et prénom</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>Profession</Label>
                  <Select value={profession} onValueChange={setProfession}>
                    <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="profession-autre">Précisez</Label>
                    <Input
                      id="profession-autre"
                      value={professionAutre}
                      onChange={(e) => setProfessionAutre(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>École de ski</Label>
                  <Select value={skiSchoolId} onValueChange={setSkiSchoolId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une école" />
                    </SelectTrigger>
                    <SelectContent>
                      {(schoolsQuery.data ?? []).map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carte">N° carte syndicale (si ESF)</Label>
                  <Input
                    id="carte"
                    value={carteSyndicale}
                    onChange={(e) => setCarteSyndicale(e.target.value)}
                  />
                </div>
                {isMoniteur && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-3">
                      <Label>Discipline</Label>
                      <RadioGroup
                        value={skiDiscipline}
                        onValueChange={setSkiDiscipline}
                        className="flex gap-4"
                      >
                        {SKI_DISCIPLINES.map((value) => (
                          <div key={value} className="flex items-center gap-2">
                            <RadioGroupItem value={value} id={`disc-${value}`} />
                            <Label htmlFor={`disc-${value}`} className="cursor-pointer">
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
                        required
                      />
                    </div>
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
                  {submitting ? "Envoi…" : "Envoyer"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
