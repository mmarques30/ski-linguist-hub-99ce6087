import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSurveyByToken, useSubmitSurvey } from "@/hooks/useSatisfactionSurvey";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle2, Loader2, Calendar, MapPin, Clock, User, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import fliLogo from "@/assets/fli-logo.png";
import { IconChip, SurfaceCard } from "@/components/ui-kit";

/**
 * Questionnaire de satisfaction — page publique, sans chrome applicatif.
 *
 * Elle n'emprunte pas `MainLayout` : c'est un formulaire autonome envoyé aux
 * stagiaires. Elle utilise en revanche les mêmes jetons et les mêmes cartes que
 * le back-office, pour rester la même marque.
 */

const SATISFACTION_QUESTIONS = [
  { key: "satisfaction_content", label: "Contenu de la formation", description: "Qualité et pertinence du contenu pédagogique" },
  { key: "satisfaction_animation", label: "Animation", description: "Qualité de l'animation par le formateur" },
  { key: "satisfaction_duration", label: "Durée", description: "Adéquation de la durée de la formation" },
  { key: "satisfaction_utility", label: "Utilité", description: "Utilité pour votre activité professionnelle" },
  { key: "satisfaction_materials", label: "Supports", description: "Qualité des supports pédagogiques" },
  { key: "satisfaction_organization", label: "Organisation", description: "Organisation logistique de la formation" },
  { key: "satisfaction_expectations", label: "Attentes", description: "Réponse à vos attentes initiales" },
];

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1" role="group">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={`Noter ${star} sur 5`}
          aria-pressed={star === value}
          className={cn(
            "rounded-[var(--radius)] transition-all",
            disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"
          )}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => !disabled && onChange(star)}
        >
          <Star
            className={cn(
              "h-8 w-8 transition-colors",
              star <= (hover || value)
                ? "fill-[hsl(var(--tint-gold-fg))] text-[hsl(var(--tint-gold-fg))]"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function SatisfactionSurvey() {
  const { token } = useParams<{ token: string }>();
  const { data: survey, isLoading, error } = useSurveyByToken(token);
  const submitSurvey = useSubmitSurvey();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [strongPoints, setStrongPoints] = useState("");
  const [weakPoints, setWeakPoints] = useState("");

  const isCompleted = !!survey?.completed_at;

  const handleScoreChange = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // Check all scores are filled
    const missingScores = SATISFACTION_QUESTIONS.filter(
      (q) => !scores[q.key] && scores[q.key] !== 0
    );

    if (missingScores.length > 0) {
      toast.error("Veuillez répondre à toutes les questions");
      return;
    }

    try {
      await submitSurvey.mutateAsync({
        token: token!,
        data: {
          satisfaction_content: scores.satisfaction_content,
          satisfaction_animation: scores.satisfaction_animation,
          satisfaction_duration: scores.satisfaction_duration,
          satisfaction_utility: scores.satisfaction_utility,
          satisfaction_materials: scores.satisfaction_materials,
          satisfaction_organization: scores.satisfaction_organization,
          satisfaction_expectations: scores.satisfaction_expectations,
          strong_points: strongPoints || null,
          weak_points: weakPoints || null,
        },
      });
      toast.success("Merci pour votre retour !");
    } catch (err) {
      toast.error("Erreur lors de l'envoi du questionnaire");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-page))] px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement du questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-page))] px-4">
        <SurfaceCard
          className="max-w-md"
          title={<span className="text-destructive">Questionnaire introuvable</span>}
        >
          <p className="text-sm text-muted-foreground">
            Ce lien n'est pas valide ou a expiré. Veuillez contacter FLI pour obtenir un nouveau
            lien.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-page))] p-4">
        <SurfaceCard className="max-w-md" bodyClassName="text-center">
          <IconChip icon={CheckCircle2} tone="teal" size="lg" className="mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[hsl(var(--tint-teal-fg))]">Merci !</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Vous avez déjà répondu à ce questionnaire le{" "}
            {format(new Date(survey.completed_at!), "d MMMM yyyy à HH:mm", { locale: fr })}.
            <br /><br />
            Vos retours sont précieux pour nous améliorer.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-page))] px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="text-center">
          <img src={fliLogo} alt="FLI" className="mx-auto mb-4 h-16" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Questionnaire de satisfaction
          </h1>
          <p className="mt-1 text-muted-foreground">
            Votre avis nous aide à améliorer nos formations
          </p>
        </div>

        {/* Formation Info Card */}
        {survey.inscription && (
          <SurfaceCard title="Votre formation" icon={BookOpen}>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-medium">
                  {survey.student?.first_name} {survey.student?.last_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  Du {format(new Date(survey.inscription.start_date), "d MMM", { locale: fr })} au{" "}
                  {format(new Date(survey.inscription.end_date), "d MMM yyyy", { locale: fr })}
                </span>
              </div>
              {survey.inscription.course_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>{survey.inscription.course_location}</span>
                </div>
              )}
              {survey.inscription.duration_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>{survey.inscription.duration_hours} heures</span>
                </div>
              )}
              {survey.inscription.instructor_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>Formateur : {survey.inscription.instructor_name}</span>
                </div>
              )}
            </dl>
          </SurfaceCard>
        )}

        {/* Satisfaction Questions */}
        <SurfaceCard
          title="Évaluez votre formation"
          icon={Star}
          description="Cliquez sur les étoiles pour noter chaque aspect (1 = insatisfait, 5 = très satisfait)"
        >
          <div className="space-y-6">
            {SATISFACTION_QUESTIONS.map((question) => (
              <div key={question.key} className="space-y-2">
                <Label className="text-base font-medium">{question.label}</Label>
                <p className="text-sm text-muted-foreground">{question.description}</p>
                <StarRating
                  value={scores[question.key] || 0}
                  onChange={(value) => handleScoreChange(question.key, value)}
                />
              </div>
            ))}
          </div>
        </SurfaceCard>

        {/* Comments */}
        <SurfaceCard
          title="Vos commentaires"
          description="Partagez vos impressions pour nous aider à nous améliorer"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strong-points">Points forts de la formation</Label>
              <Textarea
                id="strong-points"
                placeholder="Qu'avez-vous particulièrement apprécié ?"
                value={strongPoints}
                onChange={(e) => setStrongPoints(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weak-points">Points à améliorer</Label>
              <Textarea
                id="weak-points"
                placeholder="Qu'est-ce qui pourrait être amélioré ?"
                value={weakPoints}
                onChange={(e) => setWeakPoints(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </SurfaceCard>

        {/* Submit */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitSurvey.isPending}
            className="px-8"
          >
            {submitSurvey.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer mes réponses"
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="pb-4 text-center text-xs text-muted-foreground">
          FLI - Français Langue Internationale • Vos données sont confidentielles
        </p>
      </div>
    </div>
  );
}
