import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2,
  User,
  Building2,
  Calendar,
  Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useTestBookingForEvaluation, 
  useTestEvaluation,
  useCreateTestEvaluation,
  type CreateEvaluationData 
} from "@/hooks/useTestEvaluations";
import { useTestPhrases, type TestPhrase } from "@/hooks/useTestPhrases";
import { ScoreInput } from "@/components/evaluation/ScoreInput";
import { PhraseSelector } from "@/components/evaluation/PhraseSelector";
import { AppreciationPreview } from "@/components/evaluation/AppreciationPreview";
import { 
  getScoringSystem, 
  scoreToLevel,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  CATEGORIES,
  CATEGORY_LABELS
} from "@/lib/evaluation-utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SectionState {
  selectedIds: string[];
  comments: string;
}

type SectionStates = Record<string, SectionState>;

export default function EvaluationForm() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Queries
  const { data: booking, isLoading: bookingLoading } = useTestBookingForEvaluation(bookingId || "");
  const { data: existingEvaluation } = useTestEvaluation(bookingId || "");
  const { data: allPhrases } = useTestPhrases({ active: true });
  const createMutation = useCreateTestEvaluation();

  // Determine scoring system
  const scoringSystem = useMemo(() => {
    return booking?.ski_school_name 
      ? getScoringSystem(booking.ski_school_name)
      : 'sur_5';
  }, [booking?.ski_school_name]);

  // Scores state
  const [scores, setScores] = useState({
    comprehension: 0,
    expression: 0,
    structure: 0,
    technique: 0,
    conversation: 0,
    general: 0,
  });

  // Section states
  const [sections, setSections] = useState<SectionStates>(() => {
    const initial: SectionStates = {};
    CATEGORIES.forEach((cat) => {
      initial[cat] = { selectedIds: [], comments: "" };
    });
    return initial;
  });

  // General comments
  const [generalComments, setGeneralComments] = useState("");

  // Calculate average level based on general score
  const determinedLevel = useMemo(() => {
    return scoreToLevel(scores.general, scoringSystem);
  }, [scores.general, scoringSystem]);

  // Get selected phrases for preview
  const sectionDataForPreview = useMemo(() => {
    if (!allPhrases) return [];

    return CATEGORIES.map((category) => {
      const sectionState = sections[category];
      const selectedPhrases = allPhrases.filter((p) =>
        sectionState.selectedIds.includes(p.id)
      );
      return {
        category,
        selectedPhrases,
        comments: sectionState.comments,
      };
    });
  }, [sections, allPhrases]);

  const updateSection = (category: string, update: Partial<SectionState>) => {
    setSections((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...update },
    }));
  };

  const handleSave = async (isDraft: boolean = true) => {
    if (!bookingId || !booking) return;

    // Build appreciation texts from selected phrases
    const buildAppreciation = (category: string): string => {
      const section = sections[category];
      if (!allPhrases) return section.comments;

      const selectedPhrases = allPhrases
        .filter((p) => section.selectedIds.includes(p.id))
        .map((p) => p.text_fr)
        .join(" ");

      return [selectedPhrases, section.comments].filter(Boolean).join(" ");
    };

    const evaluationData: CreateEvaluationData = {
      booking_id: bookingId,
      score_general: scores.general,
      score_comprehension: scores.comprehension,
      score_expression: scores.expression,
      score_structure: scores.structure,
      score_technique: scores.technique,
      score_conversation: scores.conversation,
      scoring_system: scoringSystem,
      attestation_type: booking.ski_school_name?.toLowerCase().includes("alpe") 
        ? "alpe_huez" 
        : "generique",
      appreciation_intro: buildAppreciation("introduction"),
      appreciation_comprehension: buildAppreciation("comprehension"),
      appreciation_grammar: buildAppreciation("grammar"),
      appreciation_technique: buildAppreciation("technique"),
      appreciation_conclusion: buildAppreciation("conclusion"),
      comments_introduction: sections.introduction.comments,
      comments_comprehension: sections.comprehension.comments,
      comments_expression: sections.expression.comments,
      comments_grammar: sections.grammar.comments,
      comments_technique: sections.technique.comments,
      comments_conclusion: sections.conclusion.comments,
      comments: generalComments,
      selected_phrase_ids: Object.values(sections).flatMap((s) => s.selectedIds),
    };

    try {
      await createMutation.mutateAsync(evaluationData);
      
      if (!isDraft) {
        navigate("/formateur/evaluations");
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (bookingLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Test non trouvé</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/formateur/evaluations")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (existingEvaluation) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Évaluation déjà effectuée</h2>
          <p className="text-muted-foreground mb-4">
            Ce test a déjà été évalué. Score général: {existingEvaluation.score_general}
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/formateur/evaluations")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/formateur/evaluations")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Compte-Rendu d'Évaluation</h1>
            <p className="text-muted-foreground">
              Système de notation: {scoringSystem === 'sur_5' ? 'Sur 5' : 'Sur 20'}
            </p>
          </div>
        </div>

        {/* Candidate Info */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.candidate_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{booking.ski_school_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span>
                  {LANGUAGE_FLAGS[booking.language || 'all']}{" "}
                  {LANGUAGE_LABELS[booking.language || 'all'] || booking.language}
                </span>
              </div>
              {booking.datetime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(booking.datetime), "PPP 'à' HH:mm", { locale: fr })}
                  </span>
                </div>
              )}
              <Badge variant="outline" className="ml-auto">
                Niveau estimé: {determinedLevel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scores */}
            <Card>
              <CardHeader>
                <CardTitle>1. Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <ScoreInput
                    label="Compréhension"
                    value={scores.comprehension}
                    onChange={(v) => setScores({ ...scores, comprehension: v })}
                    scoringSystem={scoringSystem}
                  />
                  <ScoreInput
                    label="Expression"
                    value={scores.expression}
                    onChange={(v) => setScores({ ...scores, expression: v })}
                    scoringSystem={scoringSystem}
                  />
                  <ScoreInput
                    label="Structures"
                    value={scores.structure}
                    onChange={(v) => setScores({ ...scores, structure: v })}
                    scoringSystem={scoringSystem}
                  />
                  <ScoreInput
                    label="Technique"
                    value={scores.technique}
                    onChange={(v) => setScores({ ...scores, technique: v })}
                    scoringSystem={scoringSystem}
                  />
                  <ScoreInput
                    label="Conversation"
                    value={scores.conversation}
                    onChange={(v) => setScores({ ...scores, conversation: v })}
                    scoringSystem={scoringSystem}
                  />
                  <ScoreInput
                    label="GÉNÉRAL"
                    value={scores.general}
                    onChange={(v) => setScores({ ...scores, general: v })}
                    scoringSystem={scoringSystem}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Phrase Sections */}
            {CATEGORIES.map((category, index) => (
              <div key={category}>
                <PhraseSelector
                  category={category}
                  language={booking.language || 'all'}
                  profession={booking.candidate_profession}
                  level={determinedLevel}
                  selectedIds={sections[category].selectedIds}
                  onSelectionChange={(ids) => 
                    updateSection(category, { selectedIds: ids })
                  }
                  commentsValue={sections[category].comments}
                  onCommentsChange={(v) => 
                    updateSection(category, { comments: v })
                  }
                />
              </div>
            ))}

            {/* General Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Commentaires généraux</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generalComments}
                  onChange={(e) => setGeneralComments(e.target.value)}
                  placeholder="Ajoutez vos commentaires généraux (optionnel)..."
                  rows={5}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer brouillon
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={createMutation.isPending || scores.general === 0}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider et Terminer
              </Button>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="hidden lg:block">
            <AppreciationPreview
              sections={sectionDataForPreview}
              generalComments={generalComments}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
