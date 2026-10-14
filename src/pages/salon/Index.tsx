import { FormEvent, useMemo, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Mountain, UserRound } from "lucide-react";
import { toast } from "sonner";
import { MeterRow } from "@/components/ui-kit";
import fliLogo from "@/assets/fli-logo.png";
import { PlacementTestStep } from "@/components/registration/PlacementTestStep";
import { StepActions, StepCard } from "@/components/registration/StepLayout";
import { useSkiSchoolDirectory } from "@/hooks/useSkiSchoolDirectory";
import {
  OTHER_SCHOOL_OPTION,
  formatSchoolOption,
} from "@/lib/ski-school-directory";
import { REGISTRATION_LANGUAGES } from "@/lib/registration-languages";
import { isValidRegistrationEmail } from "@/lib/registration-personal-formats";
import {
  studentFacingPisteFromCecrl,
  studentFacingPisteLabel,
} from "@/lib/placement-test-engine";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import type { RegistrationData } from "@/pages/register/Index";

function isValidSalonPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

type SalonStep = "identity" | "test" | "done";

export default function SalonDirecteursPage() {
  const [step, setStep] = useState<SalonStep>("identity");
  const [formData, setFormData] = useState<Partial<RegistrationData>>({
    language: "english",
    skiNetwork: "ESF",
    profession: "ski_instructor",
  });
  const [schoolFilter, setSchoolFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: schools = [], isLoading: loadingSchools } = useSkiSchoolDirectory("ESF");

  const filteredSchools = useMemo(() => {
    const q = schoolFilter.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.nom_affiche.toLowerCase().includes(q) ||
        (s.station || "").toLowerCase().includes(q) ||
        (s.departement || "").includes(q) ||
        s.code.toLowerCase().includes(q)
    );
  }, [schools, schoolFilter]);

  const selectedCode = formData.skiSchoolCode || "";
  const isOtherSchool = selectedCode === OTHER_SCHOOL_OPTION;

  const identityReady = Boolean(
    formData.firstName?.trim() &&
      formData.lastName?.trim() &&
      formData.email?.trim() &&
      formData.phone?.trim() &&
      formData.language &&
      selectedCode &&
      (!isOtherSchool || formData.skiSchoolOther?.trim())
  );

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleIdentitySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!identityReady) return;
    if (!isValidRegistrationEmail(formData.email || "")) {
      toast.error("Indiquez une adresse e-mail valide (avec un @).");
      return;
    }
    if (!isValidSalonPhone(formData.phone || "")) {
      toast.error("Indiquez un numéro de portable valide.");
      return;
    }
    setStep("test");
  };

  const persistAndFinish = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const schoolName = isOtherSchool
      ? (formData.skiSchoolOther || "").trim()
      : (formData.skiSchool || "").trim();

    const pisteLabel =
      studentFacingPisteLabel({
        passedSlopes: formData.testSummary?.passedSlopes,
        highestSlopeReached: formData.testSummary?.highestSlopeReached,
      }) || studentFacingPisteFromCecrl(formData.currentLevel || "");

    const { error } = await supabase.rpc("submit_salon_demo_test", {
      p_first_name: (formData.firstName || "").trim(),
      p_last_name: (formData.lastName || "").trim(),
      p_email: (formData.email || "").trim(),
      p_phone: (formData.phone || "").trim(),
      p_ski_school_code: selectedCode || null,
      p_ski_school_name: schoolName,
      p_language: formData.language || "english",
      p_determined_level: pisteLabel || formData.currentLevel || null,
      p_score_percentage: formData.testScore ?? null,
      p_correct_answers: formData.correctAnswers ?? null,
      p_total_questions: formData.totalAnswered ?? null,
      p_answers: (formData.testAnswers as Json | null | undefined) ?? null,
      p_summary: (formData.testSummary as Json | null | undefined) ?? null,
    });

    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setStep("done");
  };

  const restart = () => {
    setFormData({
      language: "english",
      skiNetwork: "ESF",
      profession: "ski_instructor",
    });
    setSchoolFilter("");
    setSubmitError(null);
    setStep("identity");
  };

  const progress =
    step === "identity" ? 1 : step === "test" ? 2 : 3;

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--surface-page))]">
      <header className="sticky top-0 z-30 border-b border-border bg-[hsl(var(--surface-raised))]/95 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <img src={fliLogo} alt="FLI" className="h-9 w-auto shrink-0 sm:h-12" />
            <div className="min-w-0 text-right">
              <p className="text-xs text-muted-foreground sm:text-sm">Salon des directeurs</p>
              <p className="truncate text-sm font-semibold sm:text-base">
                Découverte du test de niveau
              </p>
            </div>
          </div>
          <div className="mt-3">
            <MeterRow
              label={
                <span className="font-medium text-foreground">
                  Étape {progress} sur 3
                </span>
              }
              value={progress}
              max={3}
              display={
                step === "identity"
                  ? "Identité"
                  : step === "test"
                    ? "Test"
                    : "Terminé"
              }
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-2xl animate-fade-up space-y-4">
          {step === "identity" && (
            <form onSubmit={handleIdentitySubmit} className="space-y-4" noValidate>
              <StepCard
                title="Qui êtes-vous ?"
                description="Coordonnées + école ESF — pour vous recontacter après le salon"
                icon={UserRound}
              >
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="salon-firstName">Prénom</Label>
                      <Input
                        id="salon-firstName"
                        value={formData.firstName || ""}
                        onChange={(e) => updateFormData({ firstName: e.target.value })}
                        placeholder="Votre prénom"
                        autoComplete="given-name"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salon-lastName">Nom</Label>
                      <Input
                        id="salon-lastName"
                        value={formData.lastName || ""}
                        onChange={(e) => updateFormData({ lastName: e.target.value })}
                        placeholder="Votre nom"
                        autoComplete="family-name"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="salon-email">E-mail</Label>
                      <Input
                        id="salon-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={formData.email || ""}
                        onChange={(e) => updateFormData({ email: e.target.value })}
                        placeholder="votre.email@exemple.com"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salon-phone">Portable</Label>
                      <Input
                        id="salon-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={formData.phone || ""}
                        onChange={(e) => updateFormData({ phone: e.target.value })}
                        placeholder="06 12 34 56 78"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>École ESF</Label>
                    {selectedCode && !isOtherSchool ? (
                      <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {formData.skiSchool}
                          </p>
                          <p className="text-xs text-muted-foreground">École sélectionnée</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateFormData({
                              skiSchoolCode: undefined,
                              skiSchool: undefined,
                              skiSchoolOther: undefined,
                            });
                            setSchoolFilter("");
                          }}
                        >
                          Changer
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          value={schoolFilter}
                          onChange={(e) => setSchoolFilter(e.target.value)}
                          placeholder="Rechercher par station ou nom…"
                          className="h-11"
                        />
                        <div
                          className="max-h-44 overflow-y-auto rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-raised))]"
                          role="listbox"
                          aria-label="Écoles ESF"
                        >
                          {loadingSchools ? (
                            <p className="p-3 text-sm text-muted-foreground">
                              Chargement du référentiel ESF…
                            </p>
                          ) : (
                            <>
                              {filteredSchools.map((s) => {
                                const active = selectedCode === s.code;
                                return (
                                  <button
                                    key={s.code}
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    className={cn(
                                      "flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0",
                                      active
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-[hsl(var(--surface-sunken))]"
                                    )}
                                    onClick={() => {
                                      updateFormData({
                                        skiSchoolCode: s.code,
                                        skiSchoolOther: undefined,
                                        skiSchool: s.nom_affiche,
                                        skiNetwork: "ESF",
                                      });
                                      setSchoolFilter("");
                                    }}
                                  >
                                    <span className="font-medium">{formatSchoolOption(s)}</span>
                                    {s.station ? (
                                      <span
                                        className={cn(
                                          "text-xs",
                                          active
                                            ? "text-primary-foreground/80"
                                            : "text-muted-foreground"
                                        )}
                                      >
                                        {s.station}
                                      </span>
                                    ) : null}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                role="option"
                                aria-selected={isOtherSchool}
                                className={cn(
                                  "flex w-full items-center px-3 py-2 text-left text-sm",
                                  isOtherSchool
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-[hsl(var(--surface-sunken))]"
                                )}
                                onClick={() =>
                                  updateFormData({
                                    skiSchoolCode: OTHER_SCHOOL_OPTION,
                                    skiSchool: undefined,
                                    skiNetwork: "ESF",
                                  })
                                }
                              >
                                Autre ESF : saisir le nom
                              </button>
                              {!loadingSchools && filteredSchools.length === 0 ? (
                                <p className="p-3 text-sm text-muted-foreground">
                                  Aucune école ne correspond à « {schoolFilter} ».
                                </p>
                              ) : null}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {isOtherSchool && (
                    <div className="space-y-2">
                      <Label htmlFor="salon-school-other">Nom de l&apos;ESF</Label>
                      <Input
                        id="salon-school-other"
                        value={formData.skiSchoolOther || ""}
                        onChange={(e) =>
                          updateFormData({
                            skiSchoolOther: e.target.value,
                            skiSchool: e.target.value,
                          })
                        }
                        placeholder="ESF …"
                        className="h-11"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="salon-language">Langue du test</Label>
                    <Select
                      value={formData.language || "english"}
                      onValueChange={(value) => updateFormData({ language: value })}
                    >
                      <SelectTrigger id="salon-language" className="h-11">
                        <SelectValue placeholder="Choisir une langue" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGISTRATION_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </StepCard>

              <StepActions>
                <Button
                  type="submit"
                  disabled={!identityReady}
                  className="h-12 w-full text-base sm:w-auto"
                >
                  Continuer vers le test
                </Button>
              </StepActions>
            </form>
          )}

          {step === "test" && (
            <div className="space-y-4">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              {submitting ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enregistrement du résultat…
                </div>
              ) : (
                <PlacementTestStep
                  data={formData}
                  onUpdate={updateFormData}
                  onNext={() => {
                    void persistAndFinish();
                  }}
                  variant="salon"
                  finishLabel="Enregistrer et terminer"
                />
              )}
            </div>
          )}

          {step === "done" && (
            <StepCard
              title={
                <span className="flex items-center gap-2">
                  <CheckCircle
                    className="h-5 w-5 shrink-0 text-[hsl(var(--status-good))]"
                    aria-hidden
                  />
                  Merci {formData.firstName}
                </span>
              }
              description="Votre essai du test FLI est enregistré"
              icon={Mountain}
            >
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Piste estimée :{" "}
                  <strong className="text-foreground">
                    {studentFacingPisteFromCecrl(formData.currentLevel || "") ||
                      formData.currentLevel ||
                      "—"}
                  </strong>
                </p>
                <p>
                  École :{" "}
                  <strong className="text-foreground">
                    {isOtherSchool
                      ? formData.skiSchoolOther
                      : formData.skiSchool}
                  </strong>
                </p>
                <p>
                  L&apos;équipe FLI peut vous présenter le parcours complet d&apos;inscription
                  et les formations pour vos moniteurs.
                </p>
                <Button type="button" variant="outline" onClick={restart} className="h-11">
                  Nouveau passage
                </Button>
              </div>
            </StepCard>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-[hsl(var(--surface-raised))]">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            France Langues International — Salon des directeurs ESF
          </p>
        </div>
      </footer>
    </div>
  );
}
