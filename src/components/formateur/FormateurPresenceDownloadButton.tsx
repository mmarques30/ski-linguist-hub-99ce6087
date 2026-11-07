import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  downloadPresenceFichePdfAsync,
  presenceLocationLabel,
  type PresenceFicheInput,
} from "@/lib/presence-fiches-pdf";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";

const PRESENCE_HEADER_LOGO_URL = "/presence-fiches/fli-header-logo.png";

/**
 * Téléchargement fiche FORMATEUR (PDF modèle 2025) — portail formateur.
 * Pas d'envoi e-mail ni de fiche stagiaire depuis le portail.
 */
export function FormateurPresenceDownloadButton({
  row,
  formateurName,
  size = "sm",
  variant = "outline",
  className,
}: {
  row: FormateurInscriptionRow;
  formateurName: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      let postalCode: string | null = null;
      let city = row.student_city ?? null;
      if (row.student_id) {
        const { data } = await supabase
          .from("students")
          .select("postal_code, city")
          .eq("id", row.student_id)
          .maybeSingle();
        postalCode = data?.postal_code ?? null;
        city = data?.city ?? city;
      }
      const input: PresenceFicheInput = {
        language: row.language || "…",
        startDate: row.start_date,
        endDate: row.end_date,
        durationHours: row.duration_hours ?? null,
        locationLabel: presenceLocationLabel({
          modality: row.modality,
          courseLocation: row.course_location,
        }),
        studentName: row.student_name || "Stagiaire",
        formateurName: formateurName || "Formateur·rice",
        studentPostalCode: postalCode,
        studentCity: city,
      };
      await downloadPresenceFichePdfAsync(
        "formateur",
        input,
        row.code,
        PRESENCE_HEADER_LOGO_URL
      );
      toast.success("Fiche de présence téléchargée");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={busy}
      onClick={download}
    >
      {busy ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-3.5 w-3.5" />
      )}
      Fiche de présence
    </Button>
  );
}
