import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  ClipboardCheck,
  User,
  Building2,
  Calendar,
  Languages,
  AlertTriangle,
} from "lucide-react";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";
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
  SCORE_GENERAL_INCOHERENT,
  isScoreAdjustmentAllowed,
  scoreGeneralCalcule,
  suggestsMethodoNote,
  type FiveScores,
} from "@/lib/evaluation-scores";
import { blocCommentsWithoutPhrases, phraseIdsForBloc } from "@/lib/test-phrases-bank";
import { collectTutoiement } from "@/lib/vouvoiement";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import { FormateurAssistBanner } from "@/components/formateur/FormateurAssistBanner";

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
  const { basePath, isAssistMode } = useFormateurView();
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
  // null = l'évaluateur n'a pas ajusté la note : on suit la moyenne calculée.
  const [generalOverride, setGeneral] = useState<number | null>(null);
  const [noteMethodologique, setNoteMethodologique] = useState("");
  const [sections, setSections] = useState<SectionStates>(emptySections);
  const [initialized, setInitialized] = useState(false);

  const calcule = useMemo(() => scoreGeneralCalcule(scores), [scores]);
  const general = generalOverride ?? calcule;
  const determinedLevel = useMemo(() => scoreToLevel(general, "sur_5"), [general]);
  const adjustmentOk = isScoreAdjustmentAllowed(general, calcule);
  const methodoSuggested = suggestsMethodoNote(general, calcule);

  useEffect(() => {
    if (existingEvaluation && (isEditMode || existingEvaluation.status === "brouillon") && !initialized) {
      setScores({
        comprehension: existingEvaluation.score_comprehension,
        expression: existingEvaluation.score_expression,
        structure: existingEvaluation.score_structure,
        technique: existingEvaluation.score_technique,
        conversation: existingEvaluation.score_conversation,
      });
      setGeneral(existingEvaluation.score_general);
      setNoteMethodologique(existingEvaluation.note_methodologique || "");
      const next = emptySections();
      BLOC_CATEGORIES.forEach((cat) => {
        const commentKey = `comments_${cat}` as keyof typeof existingEvaluation;
        const bloc = existingEvaluation[blocKey(cat)];
        const blocText = typeof bloc === "string" ? bloc : "";
        const selectedIds = phraseIdsForBloc(
          existingEvaluation.selected_phrase_ids,
          allPhrases ?? [],
          blocText,
        );
        const blocPhraseTexts = selectedIds
          .map((id) => allPhrases?.find((p) => p.id === id)?.text_fr ?? "")
          .filter(Boolean);
        next[cat] = {
          selectedIds,
          comments:
            (existingEvaluation[commentKey] as string) ||
            blocCommentsWithoutPhrases(blocText, blocPhraseTexts),
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

  const canSubmit = adjustmentOk && !hasVouvoiementIssue;

  const handleSave = async (submitForReview: boolean) => {
    if (isAssistMode) {
      toast({
        variant: "destructive",
        title: "Mode Assister",
        description: "Lecture seule — aucune modification n'est enregistrée.",
      });
      return;
    }
    if (!bookingId || !booking) return;

    if (!adjustmentOk) {
      toast({
        variant: "destructive",
        title: SCORE_GENERAL_INCOHERENT,
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
      status: submitForReview ? "a_verifier" : "brouillon",
      note_methodologique: noteMethodologique.trim() || null,
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
        navigate(`${basePath}/evaluations`);
      }
    } catch {
      // toast via mutation
    }
  };

  const isLoading = bookingLoading || evalLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const draftDisabled = isSaving || !adjustmentOk || isAssistMode;
  const actionButtons = isAssistMode ? (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Mode Assister — lecture seule</AlertTitle>
      <AlertDescription>
        Les évaluations ne peuvent pas être modifiées depuis cette prévisualisation.
      </AlertDescription>
    </Alert>
  ) : (
    <div className="fli-surface flex flex-wrap gap-4 p-4">
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

  const backLink = (
    <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/evaluations`)}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Retour à la liste
    </Button>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <PageShell>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </PageShell>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <PageShell>
          <SurfaceCard flush>
            <TableEmpty
              icon={AlertTriangle}
              title="Test non trouvé"
              action={
                <Button variant="outline" onClick={() => navigate(`${basePath}/evaluations`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Button>
              }
            />
          </SurfaceCard>
        </PageShell>
      </MainLayout>
    );
  }

  if (alreadySubmitted) {
    return (
      <MainLayout>
        <PageShell>
          <SurfaceCard>
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="mb-4 h-12 w-12 text-[hsl(var(--status-good))]" />
              <h2 className="mb-2 text-xl font-semibold">Évaluation déjà soumise</h2>
              <p className="mb-4 text-muted-foreground">
                Statut :{" "}
                {{
                  brouillon: "Brouillon",
                  a_verifier: "À vérifier",
                  valide: "Validée",
                  envoye: "Envoyée",
                }[existingEvaluation.status] ?? existingEvaluation.status}
                . Score général : {existingEvaluation.score_general}
              </p>
              <Button variant="outline" onClick={() => navigate(`${basePath}/evaluations`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Button>
            </div>
          </SurfaceCard>
        </PageShell>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageShell>
        <FormateurAssistBanner />

        <PageHeader
          back={backLink}
          title="Compte-rendu d'évaluation"
          description="Notes sur 5 · quatre blocs · vouvoiement · brouillon ou soumission"
          icon={ClipboardCheck}
          tone="gold"
        />

        {methodoSuggested && (
          <SurfaceCard>
            <div className="max-w-xl space-y-2">
              <p className="text-sm italic text-muted-foreground">
                Note méthodologique (facultative)
              </p>
              <Textarea
                id="note-methodo"
                className="italic"
                value={noteMethodologique}
                onChange={(e) => setNoteMethodologique(e.target.value)}
                placeholder="Proposition libre — non obligatoire"
                rows={2}
              />
            </div>
          </SurfaceCard>
        )}

        {existingEvaluation?.reviewer_comment && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Retour de vérification</AlertTitle>
            <AlertDescription>{existingEvaluation.reviewer_comment}</AlertDescription>
          </Alert>
        )}

        <SurfaceCard>
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{booking.candidate_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{booking.ski_school_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {LANGUAGE_FLAGS[booking.language || "all"]}{" "}
                {LANGUAGE_LABELS[booking.language || "all"] || booking.language}
              </span>
            </div>
            {booking.datetime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="tabular">
                  {format(new Date(booking.datetime), "PPP 'à' HH:mm", { locale: fr })}
                </span>
              </div>
            )}
            {booking.sponsor_type && (
              <StatusPill tone="neutral">{booking.sponsor_type}</StatusPill>
            )}
            <StatusPill tone="info" className="sm:ml-auto">
              CECRL : {determinedLevel}
            </StatusPill>
          </dl>
        </SurfaceCard>

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

        {/* Saisie à gauche, aperçu vivant à droite (collant en grand écran). */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="min-w-0 space-y-5 lg:col-span-2">
            <SurfaceCard title="1. Notes (sur 5)" icon={ClipboardCheck}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
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
                  <ScoreInput
                    label="Appréciation générale"
                    value={general}
                    onChange={setGeneral}
                    scoringSystem="sur_5"
                  />
                </div>
                {!adjustmentOk && (
                  <p className="text-sm text-destructive">{SCORE_GENERAL_INCOHERENT}</p>
                )}
              </div>
            </SurfaceCard>

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

          {/* Aperçu : empilé sous la saisie en mobile, collant à partir de lg. */}
          <div className="min-w-0">
            <AppreciationPreview sections={sectionDataForPreview} />
          </div>
        </div>
      </PageShell>
    </MainLayout>
  );
}
