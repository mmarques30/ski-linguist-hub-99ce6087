import { useState } from "react";
import { ClipboardPen, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import {
  downloadPresenceFichePdf,
  presenceLocationLabel,
  type PresenceFicheInput,
  type PresenceFicheKind,
} from "@/lib/presence-fiches-pdf";

export type PresenceFichesCardProps = {
  inscriptionCode?: string | null;
  language?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationHours?: number | null;
  modality?: string | null;
  courseLocation?: string | null;
  studentName?: string | null;
  studentId?: string | null;
  studentCity?: string | null;
  formateurName?: string | null;
};

export function PresenceFichesCard(props: PresenceFichesCardProps) {
  const [busy, setBusy] = useState<PresenceFicheKind | "both" | null>(null);

  const buildInput = async (): Promise<PresenceFicheInput> => {
    let postalCode: string | null = null;
    let city = props.studentCity ?? null;
    if (props.studentId) {
      const { data } = await supabase
        .from("students")
        .select("postal_code, city")
        .eq("id", props.studentId)
        .maybeSingle();
      postalCode = data?.postal_code ?? null;
      city = data?.city ?? city;
    }
    return {
      language: props.language || "…",
      startDate: props.startDate ?? null,
      endDate: props.endDate ?? null,
      durationHours: props.durationHours ?? null,
      locationLabel: presenceLocationLabel({
        modality: props.modality,
        courseLocation: props.courseLocation,
      }),
      studentName: props.studentName || "Stagiaire",
      formateurName: props.formateurName || "Formateur·rice",
      studentPostalCode: postalCode,
      studentCity: city,
    };
  };

  const download = async (kind: PresenceFicheKind) => {
    setBusy(kind);
    try {
      const input = await buildInput();
      downloadPresenceFichePdf(kind, input, props.inscriptionCode);
      toast.success(
        kind === "formateur"
          ? "Fiche FORMATEUR téléchargée"
          : "Fiche STAGIAIRE téléchargée"
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setBusy(null);
    }
  };

  const downloadBoth = async () => {
    setBusy("both");
    try {
      const input = await buildInput();
      downloadPresenceFichePdf("formateur", input, props.inscriptionCode);
      downloadPresenceFichePdf("stagiaire", input, props.inscriptionCode);
      toast.success("Deux fiches téléchargées");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setBusy(null);
    }
  };

  return (
    <SurfaceCard
      title="Fiches de présence"
      description="Modèles 2025 (FORMATEUR + STAGIAIRE) — à signer à chaque cours, renvoyés à FLI en fin de séances"
      icon={ClipboardPen}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        PDF préremplis (identité, dates, durée, lieu). Les lignes de cours restent
        vides pour la date, la durée et la signature manuscrite.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void download("formateur")}
        >
          {busy === "formateur" ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1 h-3.5 w-3.5" />
          )}
          Fiche FORMATEUR
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void download("stagiaire")}
        >
          {busy === "stagiaire" ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1 h-3.5 w-3.5" />
          )}
          Fiche STAGIAIRE
        </Button>
        <Button size="sm" disabled={busy !== null} onClick={() => void downloadBoth()}>
          {busy === "both" ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1 h-3.5 w-3.5" />
          )}
          Les deux
        </Button>
      </div>
    </SurfaceCard>
  );
}
