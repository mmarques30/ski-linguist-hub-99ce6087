import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  User,
  Building2,
  Calendar,
  Languages,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useTestBookingForEvaluation,
  useTestEvaluation,
  useCreateTestEvaluation,
  useUpdateTestEvaluation,
  type CreateEvaluationData,
} from "@/hooks/useTestEvaluations";
import { useTestPhrases } from "@/hooks/useTestPhrases";
import { ScoreInput } from "@/components/evaluation/ScoreInput";
import { PhraseSelector } from "@/components/evaluation/PhraseSelector";
import { AppreciationPreview } from "@/components/evaluation/AppreciationPreview";
import {
  scoreToLevel,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  BLOC_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/evaluation-utils";
import {
  isScoreAdjustmentAllowed,
  needsMethodoNote,
  scoreGeneralCalcule,
  type FiveScores,
} from "@/lib/evaluation-scores";
import { collectTutoiement } from "@/lib/vouvoiement";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SectionState {
  selectedIds: string[];
  comments: string;
}

type SectionStates = Record<(typeof BLOC_CATEGORIES)[number], SectionState>;

function emptySections(): SectionStates {
  return {
    introduction: { selectedIds: [], comments: "" },
    comprehension: { selectedIds: [], comments: "" },
    technique: { selectedIds: [], comments: "" },
    conclusion: { selectedIds: [], comments: "" },
  };
}

function blocKey(category: (typeof BLOC_CATEGORIES)[number]) {
  return `bloc_${category}` as const;
}

export default function EvaluationForm() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isEditMode = location.pathname.includes("/edit");

  const { data: booking, isLoading: bookingLoading } = useTestBookingForEvaluation(bookingId || "");
  const { data: existingEvaluation, isLoading: evalLoading } = useTestEvaluation(bookingId || "");
  const { data: allPhrases } = useTestPhrases({ active: true });
  const createMutation = useCreateTestEvaluation();
  const updateMutation = useUpdateTestEvaluation();

  const [scores, setScores] = useState<FiveScores>({
    comprehension: 0,
    expression: 0,
    structure: 0,
    technique: 0,
    conversation: 0,
  });
  const [generalOverride, setGeneralOverride] = useState<number | null>(null);
  const [noteMethodologique, setNoteMethodologique] = useState("");
  const [sections, setSections] = useState<SectionStates>(emptySections);
  const [initialized, setInitialized] = useState(false);

  const calcule = useMemo(() => scoreGeneralCalcule(scores), [scores]);
  const general = generalOverride ?? calcule;
  const determinedLevel = useMemo(() => scoreToLevel(general, "sur_5"), [general]);
  const adjustmentOk = isScoreAdjustmentAllowed(general, calcule);
  const methodoRequired = needsMethodoNote(general, calcule);

  useEffect(() => {
    if (existingEvaluation && (isEditMode || existingEvaluation.status === "brouillon") && !initialized) {
      setScores({
        comprehension: existingEvaluation.score_comprehension,
        expression: existingEvaluation.score_expression,
        structure: existingEvaluation.score_structure,
        technique: existingEvaluation.score_technique,
        conversation: existingEvaluation.score_conversation,
      });
      const storedCalcule = existingEvaluation.score_general_calcule;
      if (existingEvaluation.score_general !== storedCalcule) {
        setGeneralOverride(existingEvaluation.score_general);
      }
      setNoteMethodologique(existingEvaluation.note_methodologique || "");
      const next = emptySections();
      BLOC_CATEGORIES.forEach((cat) => {
        const commentKey = `comments_${cat}` as keyof typeof existingEvaluation;
        const bloc = existingEvaluation[blocKey(cat)];
        next[cat] = {
          selectedIds:
            existingEvaluation.selected_phrase_ids?.filter((id) => {
              const phrase = allPhrases?.find((p) => p.id === id);
              return phrase?.category === cat;
            }) || [],
          comments:
            (existingEvaluation[commentKey] as string) ||
            (typeof bloc === "string" ? bloc : "") ||
            "",
        };
      });
      setSections(next);
      setInitialized(true);
    }
  }, [existingEvaluation, isEditMode, initialized, allPhrases]);

  const buildBloc = (category: (typeof BLOC_CATEGORIES)[number]): string => {
    const section = sections[category];
    const selectedPhrases = (allPhrases ?? [])
      .filter((p) => section.selectedIds.includes(p.id))
      .map((p) => p.text_fr)
      .join(" ");
    return [selectedPhrases, section.comments].filter(Boolean).join(" ");
  };

  const tutoiementHits = useMemo(() => {
    const parts = BLOC_CATEGORIES.map((cat) => ({
      label: CATEGORY_LABELS[cat],
      text: buildBloc(cat),
    }));
    return collectTutoiement(parts);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild when sections/phrases change
  }, [sections, allPhrases]);

  const hasVouvoiementIssue = tutoiementHits.length > 0;

  const sectionDataForPreview = useMemo(() => {
    if (!allPhrases) return [];
    return BLOC_CATEGORIES.map((category) => {
      const sectionState = sections[category];
      return {
        category,
        selectedPhrases: allPhrases.filter((p) => sectionState.selectedIds.includes(p.id)),
        comments: sectionState.comments,
      };
    });
  }, [sections, allPhrases]);

  const updateSection = (category: (typeof BLOC_CATEGORIES)[number], update: Partial<SectionState>) => {
    setSections((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...update },
    }));
  };

  const attestationType =
    booking?.sponsor_type === "dsf"
      ? "dsf"
      : booking?.ski_school_name?.toLowerCase().includes("alpe d'huez")
        ? "alpe_huez"
        : "generique";

  const canSubmit =
    adjustmentOk &&
    (!methodoRequired || noteMethodologique.trim().length > 0) &&
    !hasVouvoiementIssue;

  const handleSave = async (submitForReview: boolean) => {
    if (!bookingId || !booking) return;

    if (!adjustmentOk) {
      toast({
        variant: "destructive",
        title: "Note générale hors limite",
        description: "L'écart avec la moyenne calculée ne peut pas dépasser 1 point.",
      });
      return;
    }
    if (methodoRequired && !noteMethodologique.trim()) {
      toast({
        variant: "destructive",
        title: "Note méthodologique obligatoire",
        description: "Expliquez l'écart entre la moyenne calculée et la note générale.",
      });
      return;
    }
    if (submitForReview && hasVouvoiementIssue) {
      toast({
        variant: "destructive",
        title: "Vouvoiement",
        description: "Corrigez le tutoiement avant de soumettre pour vérification.",
      });
      return;
    }

    const blocs = {
      bloc_introduction: buildBloc("introduction"),
      bloc_comprehension: buildBloc("comprehension"),
      bloc_technique: buildBloc("technique"),
      bloc_conclusion: buildBloc("conclusion"),
    };

    const evaluationData: CreateEvaluationData = {
      booking_id: bookingId,
      score_general: general,
      score_comprehension: scores.comprehension,
      score_expression: scores.expression,
      score_structure: scores.structure,
      score_technique: scores.technique,
      score_conversation: scores.conversation,
      scoring_system: "sur_5",
      attestation_type: attestationType,
      status: submitForReview ? "a_verifier" : "brouillon",
      note_methodologique: methodoRequired ? noteMethodologique.trim() : noteMethodologique.trim() || null,
      cecrl_label: determinedLevel,
      ...blocs,
      appreciation_intro: blocs.bloc_introduction,
      appreciation_comprehension: blocs.bloc_comprehension,
      appreciation_technique: blocs.bloc_technique,
      appreciation_conclusion: blocs.bloc_conclusion,
      comments_introduction: sections.introduction.comments,
      comments_comprehension: sections.comprehension.comments,
      comments_technique: sections.technique.comments,
      comments_conclusion: sections.conclusion.comments,
      selected_phrase_ids: BLOC_CATEGORIES.flatMap((cat) => sections[cat].selectedIds),
    };

    try {
      if (existingEvaluation) {
        await updateMutation.mutateAsync({
          id: existingEvaluation.id,
          ...evaluationData,
        });
      } else {
        await createMutation.mutateAsync(evaluationData);
      }
      if (submitForReview) {
        navigate("/formateur/evaluations");
      }
    } catch {
      // toast via mutation
    }
  };

  const isLoading = bookingLoading || evalLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const draftDisabled =
    isSaving || !adjustmentOk || (methodoRequired && !noteMethodologique.trim());
  const actionButtons = (
    <div className="flex flex-wrap gap-4 bg-background p-4 border rounded-lg shadow-sm">
      <Button
        variant="outline"
        onClick={() => handleSave(false)}
        disabled={draftDisabled}
      >
        <Save className="h-4 w-4 mr-2" />
        Enregistrer brouillon
      </Button>
      <Button
        onClick={() => handleSave(true)}
        disabled={isSaving || !canSubmit}
        className="flex-1"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Soumettre pour vérification
      </Button>
    </div>
  );
  const alreadySubmitted =
    existingEvaluation &&
    existingEvaluation.status !== "brouillon" &&
    !isEditMode;

  if (isLoading) {
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
          <Button variant="outline" onClick={() => navigate("/formateur/evaluations")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (alreadySubmitted) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Évaluation déjà soumise</h2>
          <p className="text-muted-foreground mb-4">
            Statut :{" "}
            {{
              brouillon: "Brouillon",
              a_verifier: "À vérifier",
              valide: "Validée",
              envoye: "Envoyée",
            }[existingEvaluation.status] ?? existingEvaluation.status}
            . Score général : {existingEvaluation.score_general}
          </p>
          <Button variant="outline" onClick={() => navigate("/formateur/evaluations")}>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/formateur/evaluations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Compte-rendu d'évaluation</h1>
            <p className="text-muted-foreground">
              Cinq notes sur 5 · quatre blocs · vouvoiement · brouillon ou soumission
            </p>
          </div>
        </div>

        {existingEvaluation?.reviewer_comment && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Retour de vérification</AlertTitle>
            <AlertDescription>{existingEvaluation.reviewer_comment}</AlertDescription>
          </Alert>
        )}

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
                  {LANGUAGE_FLAGS[booking.language || "all"]}{" "}
                  {LANGUAGE_LABELS[booking.language || "all"] || booking.language}
                </span>
              </div>
              {booking.datetime && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(booking.datetime), "PPP 'à' HH:mm", { locale: fr })}</span>
                </div>
              )}
              {booking.sponsor_type && (
                <Badge variant="outline">{booking.sponsor_type}</Badge>
              )}
              <Badge variant="outline" className="ml-auto">
                CECRL : {determinedLevel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {hasVouvoiementIssue && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Tutoiement détecté</AlertTitle>
            <AlertDescription>
              Les appréciations doivent vouvoyer le candidat.{" "}
              {tutoiementHits.map((h) => `${h.label} (${h.matches.join(", ")})`).join(" · ")}.
              Le brouillon reste possible ; la soumission est bloquée.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Cinq notes (sur 5)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <ScoreInput
                    label="Compréhension"
                    value={scores.comprehension}
                    onChange={(v) => setScores({ ...scores, comprehension: v })}
                    scoringSystem="sur_5"
                  />
                  <ScoreInput
                    label="Expression"
                    value={scores.expression}
                    onChange={(v) => setScores({ ...scores, expression: v })}
                    scoringSystem="sur_5"
                  />
                  <ScoreInput
                    label="Structures"
                    value={scores.structure}
                    onChange={(v) => setScores({ ...scores, structure: v })}
                    scoringSystem="sur_5"
                  />
                  <ScoreInput
                    label="Technique"
                    value={scores.technique}
                    onChange={(v) => setScores({ ...scores, technique: v })}
                    scoringSystem="sur_5"
                  />
                  <ScoreInput
                    label="Conversation"
                    value={scores.conversation}
                    onChange={(v) => setScores({ ...scores, conversation: v })}
                    scoringSystem="sur_5"
                  />
                </div>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">Moyenne calculée</span>
                    <Badge variant="secondary">{calcule} · {scoreToLevel(calcule, "sur_5")}</Badge>
                    <span className="text-sm text-muted-foreground">Note générale (ajustable de ±1)</span>
                    <ScoreInput
                      label="Générale"
                      value={general}
                      onChange={(v) => setGeneralOverride(v)}
                      scoringSystem="sur_5"
                    />
                  </div>
                  {!adjustmentOk && (
                    <p className="text-sm text-destructive">
                      Écart de {Math.abs(general - calcule)} : le maximum autorisé est 1 point.
                    </p>
                  )}
                  {methodoRequired && (
                    <div className="space-y-2">
                      <Label htmlFor="note-methodo">Note méthodologique (obligatoire)</Label>
                      <Textarea
                        id="note-methodo"
                        value={noteMethodologique}
                        onChange={(e) => setNoteMethodologique(e.target.value)}
                        placeholder="Pourquoi ajustez-vous la moyenne calculée ?"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {actionButtons}

            {BLOC_CATEGORIES.map((category) => (
              <PhraseSelector
                key={category}
                category={category}
                language={booking.language || "all"}
                profession={booking.candidate_profession}
                level={determinedLevel}
                selectedIds={sections[category].selectedIds}
                onSelectionChange={(ids) => updateSection(category, { selectedIds: ids })}
                commentsValue={sections[category].comments}
                onCommentsChange={(v) => updateSection(category, { comments: v })}
              />
            ))}

            {actionButtons}
          </div>

          <div className="hidden lg:block">
            <AppreciationPreview sections={sectionDataForPreview} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
