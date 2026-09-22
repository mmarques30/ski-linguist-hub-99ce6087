import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { MeterRow } from "@/components/ui-kit";
import fliLogo from "@/assets/fli-logo.png";
import { CourseSelectionStep } from "@/components/registration/CourseSelectionStep";
import { PersonalInfoStep } from "@/components/registration/PersonalInfoStep";
import { ProfessionalProfileStep } from "@/components/registration/ProfessionalProfileStep";
import { PlacementTestStep } from "@/components/registration/PlacementTestStep";
import { ExpectationsStep } from "@/components/registration/ExpectationsStep";
import { PaymentStep } from "@/components/registration/PaymentStep";
import { ConfirmationStep } from "@/components/registration/ConfirmationStep";
import { isRegistrationLanguageKey } from "@/lib/registration-languages";
import type { RegistrationPaymentOption } from "@/lib/registration-payments";

export interface RegistrationData {
  // Informations personnelles
  civility: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  hasHandicap: boolean;

  // Profil professionnel
  profession: "ski_instructor" | "other";
  skiSchool: string;

  // Formation (catalogue registration_offerings)
  offeringId?: string;
  fundingType: string;
  modality: string;
  language: string;
  duration: string;
  location: string;
  locationLabel?: string;
  dates: string;
  dateKey?: string;
  dateLabel?: string;
  startDate?: string;
  endDate?: string;
  /** BL-029 : date souhaitée quand l'offre choisie n'a pas de session datée. */
  requestedStartDate?: string;
  price?: number;
  isCustomFormat?: boolean;
  customFormatDetails?: string;

  // Test de niveau
  hasBeenEvaluated: boolean;
  currentLevel: string;
  testScore: number;
  correctAnswers?: number;
  totalAnswered?: number;
  needsAdminCall?: boolean;
  testAnswers?: Record<string, string>;
  testSummary?: {
    slopeResults: Array<{ slope: string; correct: number; total: number; passed: boolean }>;
    passedSlopes: string[];
    highestSlopeReached: string;
    endedAtVocab: boolean;
  };

  // Attentes
  expectations: string;
  certification: string;

  // Paiement
  paymentOption?: RegistrationPaymentOption;

  /** BL-027 — questionnaire OPCO (uniquement si fundingType === opco) */
  opcoKnowsOpco?: boolean | null;
  opcoName?: string;
  opcoNafCode?: string;
  opcoCaseNotes?: string;
}

const steps = [
  { id: 1, name: "Lieu et formation" },
  { id: 2, name: "Informations personnelles" },
  { id: 3, name: "Profil professionnel" },
  { id: 4, name: "Test de niveau" },
  { id: 5, name: "Attentes" },
  { id: 6, name: "Paiement" },
  { id: 7, name: "Confirmation" },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<RegistrationData>>({});

  useEffect(() => {
    const testLang = searchParams.get("test") || searchParams.get("lang");
    if (testLang && isRegistrationLanguageKey(testLang)) {
      setFormData((prev) => ({
        ...prev,
        language: testLang,
        hasBeenEvaluated: false,
      }));
    }
  }, [searchParams]);

  const progress = (currentStep / steps.length) * 100;

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CourseSelectionStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <PersonalInfoStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <ProfessionalProfileStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 4:
        return (
          <PlacementTestStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 5:
        return (
          <ExpectationsStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 6:
        return (
          <PaymentStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 7:
        return <ConfirmationStep data={formData as RegistrationData} />;
      default:
        return null;
    }
  };

  const currentStepName = steps[currentStep - 1].name;
  const programmeLabel =
    formData.profession === "other"
      ? "Formation linguistique"
      : "Formation linguistique pour moniteurs de ski";

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--surface-page))]">
      {/* En-tête + progression : collés en haut, l'étape reste visible en scrollant */}
      <header className="sticky top-0 z-30 border-b border-border bg-[hsl(var(--surface-raised))]/95 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <img src={fliLogo} alt="FLI" className="h-9 w-auto shrink-0 sm:h-12" />
            <div className="min-w-0 text-right">
              <p className="text-xs text-muted-foreground sm:text-sm">Formulaire d'inscription</p>
              <p className="truncate text-sm font-semibold sm:text-base">{programmeLabel}</p>
            </div>
          </div>

          {/* Progression — jauge du kit, en plus du fil des étapes ci-dessous */}
          <div className="mt-3">
            <MeterRow
              label={
                <span className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    Étape {currentStep} sur {steps.length}
                  </span>
                  <span className="hidden truncate text-muted-foreground xs:inline">
                    · {currentStepName}
                  </span>
                </span>
              }
              value={currentStep}
              max={steps.length}
              display={`${Math.round(progress)} %`}
            />
            <p className="mt-1.5 text-xs text-muted-foreground xs:hidden">{currentStepName}</p>
          </div>
        </div>
      </header>

      {/* Navigation des étapes */}
      <div className="border-b border-border bg-[hsl(var(--surface-sunken))]">
        <div className="container mx-auto max-w-3xl px-4">
          <ol className="flex gap-2 overflow-x-auto py-2 scrollbar-thin">
            {steps.map((step) => {
              const isCurrent = step.id === currentStep;
              const isDone = step.id < currentStep;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium transition-colors",
                      isCurrent && "bg-primary text-primary-foreground shadow-sm",
                      isDone && "bg-card text-foreground shadow-sm hover:bg-[hsl(var(--surface-raised))]",
                      !isCurrent && !isDone && "text-muted-foreground"
                    )}
                    disabled={step.id > currentStep}
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-2xs font-bold tabular",
                        isCurrent && "bg-primary-foreground/15",
                        isDone && "bg-[hsl(var(--tint-teal-bg))] text-[hsl(var(--tint-teal-fg))]",
                        !isCurrent && !isDone && "bg-muted"
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : step.id}
                    </span>
                    <span className="hidden md:inline">{step.name}</span>
                    <span className="sr-only md:hidden">{step.name}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Contenu */}
      <main className="container mx-auto flex-1 px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-2xl animate-fade-up space-y-4">
          {currentStep > 1 && (
            <Button variant="ghost" size="sm" onClick={prevStep} className="-ml-2 h-10">
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Retour
            </Button>
          )}
          {renderStep()}
        </div>
      </main>

      {/* Pied de page */}
      <footer className="border-t border-border bg-[hsl(var(--surface-raised))]">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            France Langues International - {programmeLabel}
          </p>
        </div>
      </footer>
    </div>
  );
}
