import { useMemo, useState } from "react";
import { ClipboardPen, Download, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SurfaceCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { useSendStaffEmail } from "@/hooks/useSendStaffEmail";
import { useUpdateInscriptionStatus } from "@/hooks/useInscriptions";
import {
  buildPresenceFichePdfBlobAsync,
  presenceFicheFilename,
  presenceLocationLabel,
  type PresenceFicheInput,
  type PresenceFicheKind,
  downloadPresenceFichePdfAsync,
} from "@/lib/presence-fiches-pdf";
import {
  buildFormateurMiseEnRelationBodyText,
  buildFormateurMiseEnRelationSubject,
  canSendFormateurMiseEnRelation,
  FORMATEUR_MISE_EN_RELATION_SLUG,
  formateurContactWord,
  formationLabelForMiseEnRelation,
} from "@/lib/formateur-mise-en-relation";

/** Logo d’en-tête des modèles Word 2025 (public/). */
const PRESENCE_HEADER_LOGO_URL = "/presence-fiches/fli-header-logo.png";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export type PresenceFichesCardProps = {
  inscriptionId?: string | null;
  inscriptionCode?: string | null;
  inscriptionStatus?: string | null;
  language?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationHours?: number | null;
  modality?: string | null;
  courseLocation?: string | null;
  studentName?: string | null;
  studentFirstName?: string | null;
  studentId?: string | null;
  studentCity?: string | null;
  studentEmail?: string | null;
  formateurName?: string | null;
  formateurEmail?: string | null;
  formateurPhone?: string | null;
};

export function PresenceFichesCard(props: PresenceFichesCardProps) {
  const [busy, setBusy] = useState<PresenceFicheKind | "both" | "send" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const sendEmail = useSendStaffEmail();
  const updateStatus = useUpdateInscriptionStatus();

  const contactWord = formateurContactWord(props.formateurName);
  const defaultSubject = useMemo(
    () =>
      buildFormateurMiseEnRelationSubject({
        inscriptionCode: props.inscriptionCode || "FLI",
        contactWord,
      }),
    [props.inscriptionCode, contactWord]
  );
  const defaultBody = useMemo(
    () =>
      buildFormateurMiseEnRelationBodyText({
        studentFirstName:
          props.studentFirstName ||
          (props.studentName || "").trim().split(/\s+/)[0] ||
          "",
        studentFullName: props.studentName || "",
        inscriptionCode: props.inscriptionCode || "",
        language: props.language || "",
        formationLabel: formationLabelForMiseEnRelation({
          language: props.language,
          modality: props.modality,
          startDate: props.startDate,
          endDate: props.endDate,
        }),
        formateurFullName: props.formateurName || "",
        formateurEmail: props.formateurEmail || "",
        formateurPhone: props.formateurPhone,
        contactWord,
      }),
    [props, contactWord]
  );

  const [subject, setSubject] = useState(defaultSubject);
  const [bodyText, setBodyText] = useState(defaultBody);

  const canSend = canSendFormateurMiseEnRelation({
    studentEmail: props.studentEmail,
    formateurEmail: props.formateurEmail,
    formateurName: props.formateurName,
  });

  const openConfirm = () => {
    setSubject(defaultSubject);
    setBodyText(defaultBody);
    setConfirmOpen(true);
  };

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
      await downloadPresenceFichePdfAsync(
        kind,
        input,
        props.inscriptionCode,
        PRESENCE_HEADER_LOGO_URL
      );
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
      await downloadPresenceFichePdfAsync(
        "formateur",
        input,
        props.inscriptionCode,
        PRESENCE_HEADER_LOGO_URL
      );
      await downloadPresenceFichePdfAsync(
        "stagiaire",
        input,
        props.inscriptionCode,
        PRESENCE_HEADER_LOGO_URL
      );
      toast.success("Deux fiches téléchargées");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setBusy(null);
    }
  };

  const handleSend = async () => {
    if (!canSend || !props.studentEmail || !props.formateurEmail) return;
    setBusy("send");
    try {
      const input = await buildInput();
      const [formateurBlob, stagiaireBlob] = await Promise.all([
        buildPresenceFichePdfBlobAsync("formateur", input, PRESENCE_HEADER_LOGO_URL),
        buildPresenceFichePdfBlobAsync("stagiaire", input, PRESENCE_HEADER_LOGO_URL),
      ]);
      const [formateurB64, stagiaireB64] = await Promise.all([
        blobToBase64(formateurBlob),
        blobToBase64(stagiaireBlob),
      ]);

      await sendEmail.mutateAsync({
        to: props.studentEmail.trim(),
        cc: [props.formateurEmail.trim()],
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        recipientName: props.studentName,
        studentId: props.studentId,
        inscriptionId: props.inscriptionId,
        templateSlug: FORMATEUR_MISE_EN_RELATION_SLUG,
        attachments: [
          {
            filename: presenceFicheFilename(
              "formateur",
              input.studentName,
              props.inscriptionCode
            ),
            content: formateurB64,
          },
          {
            filename: presenceFicheFilename(
              "stagiaire",
              input.studentName,
              props.inscriptionCode
            ),
            content: stagiaireB64,
          },
        ],
      });

      if (props.inscriptionId && props.inscriptionStatus === "en_attente") {
        try {
          await updateStatus.mutateAsync({
            id: props.inscriptionId,
            status: "confirmee",
          });
        } catch (statusErr) {
          console.warn("Mise en relation OK mais statut non passé en confirmée", statusErr);
          toast.message("E-mail envoyé — passez manuellement le statut en Confirmée si besoin");
        }
      }

      toast.success(
        `Mise en relation envoyée à ${props.studentEmail} (CC ${props.formateurEmail})`
      );
      setConfirmOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <SurfaceCard
        title="Fiches de présence"
        description="Modèles 2025 (FORMATEUR + STAGIAIRE) — mise en relation formateur·rice + envoi des fiches"
        icon={ClipboardPen}
      >
        <p className="mb-3 text-sm text-muted-foreground">
          PDF préremplis (identité, dates, durée, lieu). Les lignes de cours restent
          vides pour la date, la durée et la signature manuscrite. Après règlement
          complet, utilisez le bouton de mise en relation pour envoyer les fiches au
          stagiaire avec la formatrice / le formateur en copie.
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
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void downloadBoth()}>
            {busy === "both" ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1 h-3.5 w-3.5" />
            )}
            Les deux
          </Button>
          <Button size="sm" disabled={!canSend || busy !== null} onClick={openConfirm}>
            {busy === "send" ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1 h-3.5 w-3.5" />
            )}
            Mettre en relation + envoyer fiches
          </Button>
        </div>
        {!canSend && (
          <p className="mt-3 text-sm text-muted-foreground">
            Pour activer la mise en relation : e-mail stagiaire + formateur·rice
            affecté·e avec e-mail.
          </p>
        )}
      </SurfaceCard>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Mettre en relation + envoyer fiches</AlertDialogTitle>
            <AlertDialogDescription>
              Envoi à {props.studentEmail || "…"} avec copie à{" "}
              {props.formateurEmail || "…"} (BCC info@fli.fr). Les deux fiches PDF
              sont jointes. Si l’inscription est encore « En attente », elle passera
              en « Confirmée ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="mise-en-relation-subject">Objet</Label>
              <Input
                id="mise-en-relation-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mise-en-relation-body">Message</Label>
              <Textarea
                id="mise-en-relation-body"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={14}
                className="font-sans text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "send"}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy === "send" || !subject.trim() || !bodyText.trim()}
              onClick={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              {busy === "send" ? "Envoi…" : "Envoyer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
