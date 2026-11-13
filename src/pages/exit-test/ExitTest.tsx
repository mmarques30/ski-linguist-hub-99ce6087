import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import fliLogo from "@/assets/fli-logo.png";
import { PlacementTestStep } from "@/components/registration/PlacementTestStep";
import { useExitTestByToken, useSubmitExitTest } from "@/hooks/useExitTest";
import type { RegistrationData } from "@/pages/register/Index";
import type { AdaptiveTestResult } from "@/lib/placement-test-engine";
import { SurfaceCard } from "@/components/ui-kit";

/**
 * Test de fin de formation — page publique /exit-test/:token.
 * Obligatoire avant le déclenchement du dossier de fin (pack).
 */
export default function ExitTest() {
  const { token } = useParams<{ token: string }>();
  const { data: context, isLoading, error } = useExitTestByToken(token);
  const submit = useSubmitExitTest();
  const [submitted, setSubmitted] = useState(false);

  const language = context?.test.language || context?.inscription?.language || "Anglais";

  const registrationShim = useMemo(
    () =>
      ({
        language,
        modality: "en_ligne",
        profession: "ski_instructor",
      }) as Partial<RegistrationData>,
    [language]
  );

  const handleComplete = async (result: AdaptiveTestResult) => {
    if (!token || submitted || submit.isPending) return;
    try {
      const score = Math.round(
        (result.correctAnswers / Math.max(result.totalAnswered, 1)) * 100
      );
      await submit.mutateAsync({
        token,
        payload: {
          answers: {
            ...result.answers,
            summary: {
              slopeResults: result.slopeResults,
              passedSlopes: result.passedSlopes,
              highestSlopeReached: result.highestSlopeReached,
              vocabScore: result.vocabScore,
              vocabAnswers: result.vocabAnswers,
              presentationText: result.presentationText,
              exitTest: true,
            },
          },
          correct_answers: result.correctAnswers,
          total_questions: result.totalAnswered,
          score_percentage: score,
          determined_level: result.determinedLevel,
        },
      });
      setSubmitted(true);
      toast.success("Test de fin enregistré — merci");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Enregistrement impossible"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-sunken))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !context?.test) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-6">
        <img src={fliLogo} alt="FLI" className="h-10 w-auto self-start" />
        <SurfaceCard title="Lien invalide">
          <p className="text-sm text-muted-foreground">
            Ce test de fin est introuvable ou le lien a expiré. Contactez{" "}
            <a href="mailto:info@fli.fr" className="underline">
              info@fli.fr
            </a>
            .
          </p>
        </SurfaceCard>
      </div>
    );
  }

  if (context.test.completed_at || submitted) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-6">
        <img src={fliLogo} alt="FLI" className="h-10 w-auto self-start" />
        <SurfaceCard
          title={
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-good))]" />
              Test de fin déjà enregistré
            </span>
          }
        >
          <p className="text-sm text-muted-foreground">
            Merci. FLI peut maintenant préparer votre dossier de fin de formation.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-sunken))] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <img src={fliLogo} alt="FLI" className="h-10 w-auto" />
        <PlacementTestStep
          data={registrationShim}
          onUpdate={() => {}}
          onNext={() => {}}
          variant="exit"
          onComplete={handleComplete}
        />
        {submit.isPending && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement…
          </p>
        )}
      </div>
    </div>
  );
}
