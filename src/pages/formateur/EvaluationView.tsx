import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { useEvaluationWithBooking } from "@/hooks/useTestEvaluations";
import { EvaluationPDFPreview } from "@/components/evaluation/EvaluationPDFPreview";

export default function EvaluationView() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useEvaluationWithBooking(evaluationId || "");

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Évaluation non trouvée</p>
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

  const { evaluation, booking } = data;

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
            <h1 className="text-2xl font-bold">
              Évaluation - {booking.candidate_name}
            </h1>
            <p className="text-muted-foreground">
              {booking.ski_school_name}
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate(`/formateur/evaluation/${booking.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>

        {/* Content */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList>
            <TabsTrigger value="preview">
              <FileText className="h-4 w-4 mr-2" />
              Aperçu PDF
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-6">
            <EvaluationPDFPreview evaluation={evaluation} booking={booking} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
