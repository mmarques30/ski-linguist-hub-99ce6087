import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSendSatisfactionSurvey } from "@/hooks/useSendSatisfactionSurvey";
import { supabase } from "@/integrations/supabase/client";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";
import { isMissingStudentEmail, studentEmailLabel } from "@/lib/email-guards";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { SurfaceCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function optionLabel(row: FormateurInscriptionRow): string {
  const parts = [
    row.student_name?.trim() || "Stagiaire",
    row.language ? displayLanguageLabel(row.language) : null,
    inscriptionDateRangeLabel(row) || null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function FormateurSatisfactionSendPanel({
  inscriptions,
  isAssistMode,
  preselectedInscriptionId,
}: {
  inscriptions: FormateurInscriptionRow[];
  isAssistMode: boolean;
  /** Si fourni, pré-sélectionne cette mission (fiche mission / stagiaire). */
  preselectedInscriptionId?: string;
}) {
  const send = useSendSatisfactionSurvey();
  const options = useMemo(() => {
    return inscriptions
      .filter((r) => r.student_id && r.id)
      .slice()
      .sort((a, b) => (b.end_date || "").localeCompare(a.end_date || ""));
  }, [inscriptions]);

  const [inscriptionId, setInscriptionId] = useState(
    () => preselectedInscriptionId || ""
  );

  useEffect(() => {
    if (
      preselectedInscriptionId &&
      options.some((o) => o.id === preselectedInscriptionId)
    ) {
      setInscriptionId(preselectedInscriptionId);
      return;
    }
    if (!inscriptionId && options[0]?.id) {
      setInscriptionId(options[0].id);
    }
  }, [preselectedInscriptionId, options, inscriptionId]);

  const selected = options.find((o) => o.id === inscriptionId) ?? null;

  const { data: surveyMeta } = useQuery({
    queryKey: ["formateur-satisfaction-surveys", inscriptionId],
    enabled: Boolean(inscriptionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("id, completed_at, day0_sent_at, created_at")
        .eq("inscription_id", inscriptionId)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        completed_at: string | null;
        day0_sent_at: string | null;
        created_at: string;
      } | null;
    },
  });

  const emailMissing = selected
    ? isMissingStudentEmail(selected.student_email)
    : true;

  const handleSend = async () => {
    if (isAssistMode) {
      toast.message("Mode Assister : envoi désactivé");
      return;
    }
    if (!inscriptionId) {
      toast.error("Choisis un·e stagiaire / mission");
      return;
    }
    if (emailMissing) {
      toast.error("E-mail stagiaire manquant ou invalide");
      return;
    }
    if (surveyMeta?.completed_at) {
      toast.message("Questionnaire déjà rempli — pas de nouvel envoi");
      return;
    }
    await send.mutateAsync(inscriptionId);
  };

  if (options.length === 0) {
    return (
      <SurfaceCard
        title="Questionnaire de satisfaction"
        description="Envoi manuel du lien Qualiopi (dernier cours / cas particulier)"
        icon={ClipboardList}
      >
        <p className="text-sm text-muted-foreground">
          Aucune mission avec stagiaire pour envoyer un questionnaire.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      title="Questionnaire de satisfaction"
      description="Collectif : envoi auto le dernier jour. Ici : renvoi en cas de souci, ou cours individuel (tu choisis quand)."
      icon={ClipboardList}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="satisf-mission">Stagiaire / mission</Label>
          <Select value={inscriptionId} onValueChange={setInscriptionId}>
            <SelectTrigger id="satisf-mission">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((row) => (
                <SelectItem key={row.id} value={row.id}>
                  {optionLabel(row)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected ? (
          <p className="text-xs text-muted-foreground">
            Destinataire :{" "}
            <span className="text-foreground">
              {studentEmailLabel(selected.student_email)}
            </span>
            {surveyMeta?.completed_at
              ? " · déjà rempli"
              : surveyMeta?.day0_sent_at
                ? " · lien déjà envoyé (tu peux renvoyer)"
                : null}
          </p>
        ) : null}

        <Button
          type="button"
          size="sm"
          disabled={
            isAssistMode ||
            send.isPending ||
            !inscriptionId ||
            emailMissing ||
            Boolean(surveyMeta?.completed_at)
          }
          onClick={() => void handleSend()}
        >
          {send.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-3.5 w-3.5" />
          )}
          {surveyMeta?.day0_sent_at ? "Renvoyer le lien" : "Envoyer le lien"}
        </Button>
      </div>
    </SurfaceCard>
  );
}
