import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import fliLogo from "@/assets/fli-logo.png";
import { PersonalInfoStep } from "@/components/registration/PersonalInfoStep";
import { ProfessionalProfileStep } from "@/components/registration/ProfessionalProfileStep";
import { TrainingConfigStep } from "@/components/registration/TrainingConfigStep";
import { PlacementTestStep } from "@/components/registration/PlacementTestStep";
import { ExpectationsStep } from "@/components/registration/ExpectationsStep";
import { ConfirmationStep } from "@/components/registration/ConfirmationStep";
import { isRegistrationLanguageKey } from "@/lib/registration-languages";

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
  
  // Configuration de la formation
  fundingType: string;
  modality: string;
  language: string;
  duration: string;
  location: string;
  dates: string;
  
  // Test de niveau
  hasBeenEvaluated: boolean;
  currentLevel: string;
  testScore: number;
  correctAnswers?: number;
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
}

const steps = [
  { id: 1, name: "Informations personnelles" },
  { id: 2, name: "Profil professionnel" },
  { id: 3, name: "Configuration formation" },
  { id: 4, name: "Test de niveau" },
  { id: 5, name: "Attentes" },
  { id: 6, name: "Confirmation" },
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
          <PersonalInfoStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <ProfessionalProfileStep
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <TrainingConfigStep
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
        return <ConfirmationStep data={formData as RegistrationData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img src={fliLogo} alt="FLI" className="h-12 w-auto" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Formulaire d'inscription</p>
              <p className="font-semibold">Formation linguistique pour moniteurs de ski</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progression */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Étape {currentStep} sur {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {steps[currentStep - 1].name}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Navigation des étapes */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-thin py-2 gap-2">
            {steps.map((step) => (
              <button
                key={step.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
                disabled={step.id > currentStep}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/20 text-xs font-bold">
                  {step.id}
                </span>
                <span className="hidden md:inline">{step.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              className="mb-6"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          )}
          {renderStep()}
        </div>
      </main>

      {/* Pied de page */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            France Langues International - Formation linguistique pour moniteurs de ski
          </p>
        </div>
      </footer>
    </div>
  );
}
