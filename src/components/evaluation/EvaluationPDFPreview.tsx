import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { 
  LANGUAGE_FLAGS, 
  LANGUAGE_LABELS, 
  scoreToLevel,
  CATEGORY_LABELS
} from "@/lib/evaluation-utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TestEvaluation, TestBookingComplete } from "@/hooks/useTestEvaluations";
import fliLogo from "@/assets/fli-invoice-logo.png";

interface EvaluationPDFPreviewProps {
  evaluation: TestEvaluation;
  booking: TestBookingComplete;
}

export function EvaluationPDFPreview({ evaluation, booking }: EvaluationPDFPreviewProps) {
  const level = scoreToLevel(evaluation.score_general, evaluation.scoring_system as 'sur_5' | 'sur_20');
  const maxScore = evaluation.scoring_system === 'sur_20' ? 20 : 5;

  const handlePrint = () => {
    window.print();
  };

  const scores = [
    { label: "Compréhension", value: evaluation.score_comprehension },
    { label: "Expression", value: evaluation.score_expression },
    { label: "Structures", value: evaluation.score_structure },
    { label: "Technique", value: evaluation.score_technique },
    { label: "Conversation", value: evaluation.score_conversation },
    { label: "Général", value: evaluation.score_general, highlight: true },
  ];

  const appreciations = [
    { label: "Introduction", text: evaluation.appreciation_intro },
    { label: "Compréhension", text: evaluation.appreciation_comprehension },
    { label: "Grammaire", text: evaluation.appreciation_grammar },
    { label: "Technique", text: evaluation.appreciation_technique },
    { label: "Conclusion", text: evaluation.appreciation_conclusion },
  ].filter(a => a.text);

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </div>

      {/* PDF Content */}
      <div className="bg-white border rounded-lg p-8 print:border-none print:p-0" id="evaluation-pdf">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <img src={fliLogo} alt="FLI Logo" className="h-16 mb-4" />
            <h1 className="text-2xl font-bold text-primary">COMPTE-RENDU D'ÉVALUATION</h1>
            <p className="text-muted-foreground">
              Test de niveau linguistique
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Niveau: {level}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {booking.datetime && format(new Date(booking.datetime), "dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Candidate Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">CANDIDAT</h3>
            <p className="font-medium text-lg">{booking.candidate_name}</p>
            <p className="text-sm text-muted-foreground">{booking.candidate_email}</p>
            <p className="text-sm text-muted-foreground">{booking.candidate_phone}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">ÉCOLE / LANGUE</h3>
            <p className="font-medium">{booking.ski_school_name}</p>
            <p className="text-sm">
              {LANGUAGE_FLAGS[booking.language || 'all']}{" "}
              {LANGUAGE_LABELS[booking.language || 'all']}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              Profession: {booking.candidate_profession}
            </p>
          </div>
        </div>

        {/* Scores */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notes ({evaluation.scoring_system === 'sur_20' ? 'sur 20' : 'sur 5'})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {scores.map((score) => (
                <div 
                  key={score.label} 
                  className={`text-center p-3 rounded-lg ${
                    score.highlight 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-2xl font-bold">
                    {score.value}/{maxScore}
                  </div>
                  <div className="text-xs font-medium opacity-80">
                    {score.label}
                  </div>
                  <div className="text-xs opacity-60">
                    {scoreToLevel(score.value, evaluation.scoring_system as 'sur_5' | 'sur_20')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appreciations */}
        {appreciations.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Appréciation détaillée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appreciations.map((appreciation) => (
                <div key={appreciation.label}>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    {appreciation.label}
                  </h4>
                  <p className="text-sm">{appreciation.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* General Comments */}
        {evaluation.comments && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Commentaires généraux</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{evaluation.comments}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Separator className="my-6" />
        <div className="text-center text-xs text-muted-foreground">
          <p>France Langues International - Organisme de formation n° 84 73 02523 73</p>
          <p>100 Route des Esserts, 73800 Montmélian - contact@fli-formation.fr</p>
          <p className="mt-2">
            Document généré le {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
          </p>
        </div>
      </div>
    </div>
  );
}
