import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  useEvaluationWithBooking,
  useUpdateTestEvaluation,
} from "@/hooks/useTestEvaluations";
import {
  BLOC_CATEGORIES,
  CATEGORY_LABELS,
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
} from "@/lib/evaluation-utils";
import {
  ABSOLUTE_RULES,
  listStructureMotifs,
  structureAllowsValidation,
} from "@/lib/evaluation-structure";
import {
  applySpellingProposal,
  findSpellingProposals,
  type SpellingProposal,
} from "@/lib/evaluation-spellcheck";
import { useToast } from "@/hooks/use-toast";

function blocField(category: (typeof BLOC_CATEGORIES)[number]) {
  return `bloc_${category}` as const;
}

export default function EvaluationVerify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isFormateur } = useUserPermissions();
  const { toast } = useToast();
  const { data, isLoading } = useEvaluationWithBooking(id || "");
  const updateMutation = useUpdateTestEvaluation();
  const [refuseComment, setRefuseComment] = useState("");
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  const evaluation = data?.evaluation;
  const booking = data?.booking;

  const motifs = useMemo(
    () => (evaluation ? listStructureMotifs(evaluation) : []),
    [evaluation]
  );
  const canValidate = structureAllowsValidation(motifs);

  const spellingParts = useMemo(() => {
    if (!evaluation) return [];
    return BLOC_CATEGORIES.map((cat) => ({
      field: blocField(cat),
      label: CATEGORY_LABELS[cat],
      text: (evaluation[blocField(cat)] as string) || "",
    }));
  }, [evaluation]);

  const proposals = useMemo(
    () => findSpellingProposals(spellingParts).filter((p) => !ignoredIds.has(p.id)),
    [spellingParts, ignoredIds]
  );

  const nextProposal: SpellingProposal | undefined = proposals[0];

  const handleAcceptSpelling = async () => {
    if (!evaluation || !nextProposal) return;
    const current = (evaluation[nextProposal.field as keyof typeof evaluation] as string) || "";
    const next = applySpellingProposal(current, nextProposal);
    await updateMutation.mutateAsync({
      id: evaluation.id,
      [nextProposal.field]: next,
    });
  };

  const handleValidate = async () => {
    if (!evaluation || !user) return;
    if (!canValidate) {
      toast({
        variant: "destructive",
        title: "Structure non conforme",
        description: "Corrigez les motifs listés ou refusez avec un commentaire.",
      });
      return;
    }
    await updateMutation.mutateAsync({
      id: evaluation.id,
      status: "valide",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    });
    toast({ title: "Évaluation validée" });
    navigate("/formateur/evaluations");
  };

  const handleRefuse = async () => {
    if (!evaluation || !user) return;
    if (!refuseComment.trim()) {
      toast({
        variant: "destructive",
        title: "Commentaire obligatoire",
        description: "Expliquez au formateur pourquoi le compte-rendu revient en brouillon.",
      });
      return;
    }
    await updateMutation.mutateAsync({
      id: evaluation.id,
      status: "brouillon",
      reviewer_comment: refuseComment.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    });
    toast({ title: "Renvoyée en brouillon" });
    navigate("/formateur/evaluations");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!evaluation || !booking) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Évaluation non trouvée</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/formateur/evaluations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </MainLayout>
    );
  }

  const actionsEnabled = isAdmin && evaluation.status === "a_verifier";

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/formateur/evaluations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Vérification du compte-rendu</h1>
            <p className="text-muted-foreground">
              {booking.candidate_name} · {booking.ski_school_name} ·{" "}
              {LANGUAGE_FLAGS[booking.language || "all"]}{" "}
              {LANGUAGE_LABELS[booking.language || "all"] || booking.language}
            </p>
          </div>
          <Badge variant="outline">
            {evaluation.status === "a_verifier"
              ? "À vérifier"
              : evaluation.status === "valide"
                ? "Validée"
                : evaluation.status}
          </Badge>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Règles absolues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {ABSOLUTE_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {!isAdmin && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lecture seule</AlertTitle>
            <AlertDescription>
              La validation et le refus sont réservés à Paula.{" "}
              {isFormateur
                ? "Si le compte-rendu est renvoyé en brouillon, le commentaire apparaîtra sur le formulaire de saisie."
                : null}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contrôle de structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {motifs.map((motif) => (
                <div key={motif.id} className="flex items-start gap-3 rounded-lg border p-3">
                  {motif.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{motif.label}</p>
                    <p className="text-sm text-muted-foreground">{motif.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relecture orthographique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Une proposition à la fois. Accepter remplace uniquement ce mot. Ignorer passe à la suivante.
                Aucune réécriture globale.
              </p>
              {nextProposal ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <Badge variant="outline">{nextProposal.label}</Badge>
                  <p className="text-sm">
                    <span className="line-through text-destructive">{nextProposal.from}</span>
                    {" → "}
                    <span className="font-medium text-green-700">{nextProposal.to}</span>
                  </p>
                  {actionsEnabled && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleAcceptSpelling()}
                        disabled={updateMutation.isPending}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setIgnoredIds((prev) => new Set(prev).add(nextProposal.id))
                        }
                      >
                        Ignorer
                      </Button>
                    </div>
                  )}
                  {proposals.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {proposals.length - 1} autre(s) proposition(s) ensuite
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune proposition restante.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Texte des quatre blocs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {BLOC_CATEGORIES.map((cat) => {
              const text = (evaluation[blocField(cat)] as string) || "";
              return (
                <div key={cat}>
                  <p className="text-sm font-medium mb-1">{CATEGORY_LABELS[cat]}</p>
                  <p className="text-sm rounded-md border bg-muted/30 p-3 whitespace-pre-wrap">
                    {text.trim() || <span className="text-muted-foreground">— vide —</span>}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {actionsEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Décision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refuse-comment">Commentaire au formateur (obligatoire en cas de refus)</Label>
                <Textarea
                  id="refuse-comment"
                  rows={4}
                  value={refuseComment}
                  onChange={(e) => setRefuseComment(e.target.value)}
                  placeholder="Précisez les corrections attendues. Le formateur verra ce texte sur son brouillon."
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleValidate()}
                  disabled={updateMutation.isPending || !canValidate}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Valider
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleRefuse()}
                  disabled={updateMutation.isPending || !refuseComment.trim()}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser (retour brouillon)
                </Button>
              </div>
              {!canValidate && (
                <p className="text-sm text-destructive">
                  La validation est bloquée tant qu&apos;un motif de structure n&apos;est pas conforme.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
