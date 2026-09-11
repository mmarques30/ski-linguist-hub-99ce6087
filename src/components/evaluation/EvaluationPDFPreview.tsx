import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
} from "@/lib/evaluation-utils";
import {
  ESF_COURSE_TABLE,
  ESF_DIRECTOR_NOTE,
  ESF_REGIONAL_SECTIONS,
  ESF_RETEST_NOTE,
  buildEvaluationPdfModel,
  parseEvaluationPriceTtc,
  parseFliIdentity,
  type FliIdentity,
} from "@/lib/evaluation-pdf";
import type { TestEvaluation, TestBookingComplete } from "@/hooks/useTestEvaluations";
import fliLogo from "@/assets/fli-invoice-logo.png";

interface EvaluationPDFPreviewProps {
  evaluation: TestEvaluation;
  booking: TestBookingComplete;
}

function usePdfSettings() {
  return useQuery({
    queryKey: ["evaluation-pdf-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["evaluation_price_ttc", "fli_identity"]);
      if (error) throw error;
      const price = parseEvaluationPriceTtc(
        data?.find((row) => row.key === "evaluation_price_ttc")?.value
      );
      const identity = parseFliIdentity(
        data?.find((row) => row.key === "fli_identity")?.value
      );
      return { price, identity };
    },
  });
}

export function EvaluationPDFPreview({ evaluation, booking }: EvaluationPDFPreviewProps) {
  const { data: settings } = usePdfSettings();
  const identity: FliIdentity = settings?.identity ?? {
    legal_name: "",
    address_line: "",
    postal_code: "",
    city: "",
    phone: "",
    email: "",
  };

  let model = null as ReturnType<typeof buildEvaluationPdfModel> | null;
  let modelError: string | null = null;
  try {
    if (booking.sponsor_type && settings?.identity) {
      model = buildEvaluationPdfModel({
        sponsorType: booking.sponsor_type,
        evaluatedAt: booking.datetime ? new Date(booking.datetime) : new Date(),
        candidateName: booking.candidate_name || "",
        candidateProfession: booking.candidate_profession,
        language: booking.language || "anglais",
        previousTest: Boolean(booking.previous_test),
        skiSchoolName: booking.ski_school_name,
        companyName: booking.ski_school_name,
        instructorName: booking.instructor_name,
        scores: {
          comprehension: evaluation.score_comprehension,
          expression: evaluation.score_expression,
          structure: evaluation.score_structure,
          technique: evaluation.score_technique,
          conversation: evaluation.score_conversation,
          general: evaluation.score_general,
        },
        cecrlGeneral: evaluation.cecrl_label,
        blocs: {
          introduction: evaluation.bloc_introduction || evaluation.appreciation_intro || "",
          comprehension:
            evaluation.bloc_comprehension || evaluation.appreciation_comprehension || "",
          technique: evaluation.bloc_technique || evaluation.appreciation_technique || "",
          conclusion: evaluation.bloc_conclusion || evaluation.appreciation_conclusion || "",
        },
        noteMethodologique: evaluation.note_methodologique,
        priceTtc: settings.price,
        identity: settings.identity,
      });
    }
  } catch (err) {
    modelError = err instanceof Error ? err.message : "Aperçu indisponible";
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </div>

      <div className="bg-white border rounded-lg p-8 print:border-none print:p-0" id="evaluation-pdf">
        {model?.showFliHeaderFooter && (
          <img src={fliLogo} alt="FLI" className="h-14 mb-4" />
        )}
        {model?.showSyndicateHeader && (
          <p className="text-xs font-semibold tracking-wide text-primary mb-1">SNMSF / ESF</p>
        )}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {model?.title ?? "Évaluation en langue vivante"}
            </h1>
            {booking.sponsor_type && (
              <Badge variant="outline" className="mt-2">
                {booking.sponsor_type}
              </Badge>
            )}
          </div>
        </div>

        {modelError && (
          <p className="text-sm text-destructive mb-4">{modelError}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <p><span className="text-muted-foreground">Nom – Prénom :</span> {booking.candidate_name}</p>
          {model?.showCompanyField ? (
            <p><span className="text-muted-foreground">Entreprise :</span> {model.companyName}</p>
          ) : (
            <p>
              <span className="text-muted-foreground">
                {booking.sponsor_type === "esf" ? "ESF" : "École de ski"} :
              </span>{" "}
              {booking.ski_school_name}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Langue :</span>{" "}
            {LANGUAGE_FLAGS[booking.language || "all"]}{" "}
            {LANGUAGE_LABELS[booking.language || "all"] || booking.language}
          </p>
          <p>
            <span className="text-muted-foreground">Date :</span> {model?.evaluatedOn}
          </p>
          <p>
            <span className="text-muted-foreground">Formateur :</span> {booking.instructor_name}
          </p>
          <p>
            <span className="text-muted-foreground">Profession :</span> {booking.candidate_profession}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Niveau de 0 à 5 — N - CECRL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(model?.skillRows ?? []).map((row) => (
                <div key={row.label} className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">{row.label}</div>
                  <div className="text-lg font-bold">{row.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {model?.showPrice && model.priceLabel && (
          <p className="font-semibold mb-4">Tarif {model.priceLabel}</p>
        )}

        {model?.noteMethodologique && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Note méthodologique</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{model.noteMethodologique}</p>
            </CardContent>
          </Card>
        )}

        {model?.showCourseTable && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Niveau ↔ type de cours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{ESF_DIRECTOR_NOTE}</p>
              {ESF_COURSE_TABLE.map((row) => (
                <div key={row.course} className="flex justify-between gap-4">
                  <span>{row.course}</span>
                  <span className="font-medium">{row.level}</span>
                </div>
              ))}
              <p className="text-muted-foreground">{ESF_RETEST_NOTE}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quatre blocs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(model?.blocs ?? []).map((bloc) => (
              <div key={bloc.label}>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">{bloc.label}</h4>
                <p className="text-sm">{bloc.text || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {model?.showRegionalSections && (
          <div className="text-xs text-muted-foreground space-y-1 mb-6">
            {ESF_REGIONAL_SECTIONS.map((section) => (
              <p key={section.phone}>
                {section.phone} – {section.places}
              </p>
            ))}
          </div>
        )}

        <Separator className="my-6" />
        <div className="text-center text-xs text-muted-foreground">
          {identity.legal_name ? (
            <>
              <p>{identity.legal_name}</p>
              <p>
                {identity.address_line}, {identity.postal_code} {identity.city}
                {identity.phone ? ` — ${identity.phone}` : ""}
                {identity.email ? ` — ${identity.email}` : ""}
              </p>
            </>
          ) : (
            <p>Identité FLI chargée depuis les paramètres.</p>
          )}
        </div>
      </div>
    </div>
  );
}
