import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { analyzeCfpAttestationFile } from "@/lib/fifpl-cfp-attestation";
import {
  estimateFifplRights,
  FIFPL_CRITERIA_YEAR,
  FIFPL_REGISTER_COPY,
  type FifplProfessionalStatus,
  type FifplQuestionnaire,
} from "@/lib/fifpl-funding";
import { uploadRegistrationDocument } from "@/services/registrationDocuments";
import { formatPriceEUR } from "@/lib/registration-offerings";
import { OptionCard, SummaryPanel, SummaryRow } from "./StepLayout";

interface FifplCfpSectionProps {
  questionnaire: FifplQuestionnaire;
  modality?: string;
  onChange: (patch: Partial<FifplQuestionnaire>) => void;
}

export function FifplCfpSection({ questionnaire, modality, onChange }: FifplCfpSectionProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const alreadyCovered =
    questionnaire.hadOtherFifplTrainingThisYear === true
      ? questionnaire.otherFifplAmountAlreadyCoveredEur
      : 0;

  const rights = estimateFifplRights({
    status: questionnaire.status,
    cfpContributionEur: questionnaire.cfpContributionEur,
    modality,
    alreadyCoveredEur: alreadyCovered,
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const analysis = await analyzeCfpAttestationFile(file);
      onChange({
        cfpAttestationFileName: file.name,
        cfpAttestationYear: analysis.year,
        cfpContributionEur: analysis.contributionEur ?? questionnaire.cfpContributionEur,
        status: analysis.suggestedStatus ?? questionnaire.status,
        parseWarnings: analysis.warnings,
        cfpAttestationPath: null,
      });

      setUploading(true);
      const path = await uploadRegistrationDocument({
        documentKind: "cfp-attestation",
        file,
      });
      onChange({
        cfpAttestationPath: path,
        cfpAttestationFileName: file.name,
        cfpAttestationYear: analysis.year,
        cfpContributionEur: analysis.contributionEur ?? questionnaire.cfpContributionEur,
        status: analysis.suggestedStatus ?? questionnaire.status,
        parseWarnings: analysis.warnings,
      });
      toast.success("Attestation CFP déposée et analysée");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Impossible de traiter l’attestation CFP"
      );
    } finally {
      setAnalyzing(false);
      setUploading(false);
    }
  };

  const busy = analyzing || uploading;

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription className="space-y-2 text-sm">
          <p>{FIFPL_REGISTER_COPY.sectionDescription}</p>
          <p className="text-muted-foreground">{FIFPL_REGISTER_COPY.urssafHint}</p>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="cfp-attestation">Attestation CFP URSSAF {FIFPL_CRITERIA_YEAR} *</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="cfp-attestation"
            type="file"
            accept="application/pdf,.pdf,image/jpeg,image/png"
            disabled={busy}
            className="h-11 cursor-pointer"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          {busy && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {analyzing ? "Analyse…" : "Dépôt…"}
            </span>
          )}
        </div>
        {questionnaire.cfpAttestationFileName && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {questionnaire.cfpAttestationFileName}
            {questionnaire.cfpAttestationPath ? " — déposée" : ""}
          </p>
        )}
        {questionnaire.parseWarnings.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription className="space-y-1 text-sm">
              {questionnaire.parseWarnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cfp-year">Année de l&apos;attestation *</Label>
          <Input
            id="cfp-year"
            type="number"
            inputMode="numeric"
            value={questionnaire.cfpAttestationYear ?? ""}
            onChange={(e) =>
              onChange({
                cfpAttestationYear: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder={String(FIFPL_CRITERIA_YEAR)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cfp-amount">Cotisation CFP (€)</Label>
          <Input
            id="cfp-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={questionnaire.cfpContributionEur ?? ""}
            onChange={(e) =>
              onChange({
                cfpContributionEur: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="Ex. 87,50"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            Obligatoire pour les micro-entrepreneurs (grille FIFPL).
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Votre statut professionnel *</Label>
        <RadioGroup
          value={questionnaire.status ?? ""}
          onValueChange={(value) => onChange({ status: value as FifplProfessionalStatus })}
          className="grid gap-2 sm:grid-cols-2"
        >
          <OptionCard selected={questionnaire.status === "independant"}>
            <Label
              htmlFor="fifpl-independant"
              className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
            >
              <RadioGroupItem value="independant" id="fifpl-independant" />
              Indépendant — 100 % des critères
            </Label>
          </OptionCard>
          <OptionCard selected={questionnaire.status === "micro_entrepreneur"}>
            <Label
              htmlFor="fifpl-micro"
              className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
            >
              <RadioGroupItem value="micro_entrepreneur" id="fifpl-micro" />
              Micro-entrepreneur — selon cotisation CFP
            </Label>
          </OptionCard>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{FIFPL_REGISTER_COPY.otherTrainingLabel} *</Label>
        <p className="text-sm text-muted-foreground">{FIFPL_REGISTER_COPY.otherTrainingHelp}</p>
        <RadioGroup
          value={
            questionnaire.hadOtherFifplTrainingThisYear === true
              ? "yes"
              : questionnaire.hadOtherFifplTrainingThisYear === false
                ? "no"
                : ""
          }
          onValueChange={(value) =>
            onChange({
              hadOtherFifplTrainingThisYear: value === "yes",
              ...(value === "no" ? { otherFifplAmountAlreadyCoveredEur: null } : {}),
            })
          }
          className="grid gap-2 sm:grid-cols-2"
        >
          <OptionCard selected={questionnaire.hadOtherFifplTrainingThisYear === false}>
            <Label
              htmlFor="fifpl-other-no"
              className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
            >
              <RadioGroupItem value="no" id="fifpl-other-no" />
              Non
            </Label>
          </OptionCard>
          <OptionCard selected={questionnaire.hadOtherFifplTrainingThisYear === true}>
            <Label
              htmlFor="fifpl-other-yes"
              className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 font-normal"
            >
              <RadioGroupItem value="yes" id="fifpl-other-yes" />
              Oui
            </Label>
          </OptionCard>
        </RadioGroup>

        {questionnaire.hadOtherFifplTrainingThisYear === true && (
          <div className="space-y-2">
            <Label htmlFor="fifpl-already">{FIFPL_REGISTER_COPY.alreadyCoveredLabel} *</Label>
            <Input
              id="fifpl-already"
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={questionnaire.otherFifplAmountAlreadyCoveredEur ?? ""}
              onChange={(e) =>
                onChange({
                  otherFifplAmountAlreadyCoveredEur: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              className="h-11"
            />
          </div>
        )}
      </div>

      {rights && (
        <SummaryPanel>
          <SummaryRow
            label={`Plafond annuel ${FIFPL_CRITERIA_YEAR}`}
            value={formatPriceEUR(rights.annualCeilingBaseEur)}
          />
          <SummaryRow label="Taux applicable" value={`${rights.rightsPercent} %`} />
          <SummaryRow label="Droits bruts estimés" value={formatPriceEUR(rights.grossRightsEur)} />
          {rights.alreadyCoveredEur > 0 && (
            <SummaryRow
              label="Déjà pris en charge (déduit)"
              value={`− ${formatPriceEUR(rights.alreadyCoveredEur)}`}
            />
          )}
          <SummaryRow
            label="Droits restants estimés"
            value={formatPriceEUR(rights.remainingRightsEur)}
            emphasis
          />
          {rights.isElearning && (
            <p className="pt-1 text-xs text-muted-foreground">
              Formation e-learning : plafonds réduits de 50 % selon les critères FIFPL.
            </p>
          )}
        </SummaryPanel>
      )}

      {questionnaire.cfpAttestationPath && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() =>
            onChange({
              cfpAttestationPath: null,
              cfpAttestationFileName: null,
              parseWarnings: [],
            })
          }
        >
          Remplacer l&apos;attestation
        </Button>
      )}
    </div>
  );
}
