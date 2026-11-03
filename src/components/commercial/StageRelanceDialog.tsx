import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSendStaffEmail } from "@/hooks/useSendStaffEmail";
import { canSendStaffEmail } from "@/lib/staff-email";
import {
  buildAlumniRelanceDraft,
  buildCommercialTestEnvelope,
  buildDirectorRelanceDraft,
  COMMERCIAL_TEST_TO,
  recipientsToCsv,
  type RelanceAudience,
  type StageFillAlumni,
  type StageFillDirector,
  type StageFillRow,
} from "@/lib/commercial-stage-fill";
import { StatusPill } from "@/components/ui-kit";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: StageFillRow[];
  audience: RelanceAudience;
  directors: StageFillDirector[];
  alumni: StageFillAlumni[];
  stationLabel?: string;
};

/**
 * Prépare le brouillon et envoie un seul mail à info@fli.fr (bouton Envoyer).
 * Pas d'envoi de masse ici tant que l'edge skipNotifyBcc + digest n'est pas
 * déployé — évite une copie BCC par destinataire.
 */
export function StageRelanceDialog({
  open,
  onOpenChange,
  rows,
  audience,
  directors,
  alumni,
  stationLabel,
}: Props) {
  const sendEmail = useSendStaffEmail();
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sending, setSending] = useState(false);

  const primary = rows[0] ?? null;
  const offerings = useMemo(() => rows.map((r) => r.offering), [rows]);

  const recipients = useMemo(() => {
    if (audience === "directeur") {
      return directors.map((d) => ({
        email: d.email,
        name: d.directeur?.trim() || d.nom_affiche,
        detail: d.nom_affiche,
      }));
    }
    return alumni.map((a) => ({
      email: a.email,
      name: `${a.firstName} ${a.lastName}`.trim(),
      detail: a.languageLabel,
    }));
  }, [audience, directors, alumni]);

  useEffect(() => {
    if (!open || rows.length === 0) return;
    if (audience === "directeur") {
      const draft = buildDirectorRelanceDraft({
        offerings,
        directeurName: directors[0]?.directeur ?? null,
      });
      setSubject(draft.subject);
      setBodyText(draft.bodyText);
    } else if (primary) {
      const draft = buildAlumniRelanceDraft({
        offering: primary.offering,
        firstName: alumni[0]?.firstName ?? "",
      });
      setSubject(draft.subject);
      setBodyText(draft.bodyText);
    }
  }, [open, rows, offerings, audience, directors, alumni, primary]);

  const title =
    audience === "directeur"
      ? `Relance directeurs${stationLabel ? ` — ${stationLabel}` : ""}`
      : "Relance anciens stagiaires";

  const description =
    audience === "directeur"
      ? rows
          .map(
            (r) =>
              `${r.offering.language_label} (${r.enrolledCount}/${r.minRequired})`
          )
          .join(" · ")
      : primary
        ? `${primary.offering.session_code} · ${primary.offering.location_label} · ${primary.offering.language_label}`
        : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${subject}\n\n${bodyText}`);
    toast.success("Brouillon copié");
  };

  const handleExport = () => {
    const csv = recipientsToCsv(recipients);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug =
      audience === "directeur"
        ? stationLabel?.replace(/\s+/g, "-") ?? "station"
        : primary?.offering.session_code ?? "stage";
    a.download = `relance-${audience}-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canSend =
    canSendStaffEmail({ subject, bodyText }) &&
    recipients.length > 0 &&
    !sending &&
    !sendEmail.isPending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const envelope = buildCommercialTestEnvelope({
        audience,
        draftSubject: subject.trim(),
        draftBody: bodyText,
        recipients,
        contextLabel: stationLabel ?? primary?.offering.session_code ?? undefined,
      });
      await sendEmail.mutateAsync({
        to: COMMERCIAL_TEST_TO,
        subject: envelope.subject,
        bodyText: envelope.bodyText,
        recipientName: "FLI",
        templateSlug: "staff_manual",
      });
      toast.success(`Envoyé à ${COMMERCIAL_TEST_TO} (1 seul message)`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  if (rows.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            Le bouton <strong>Envoyer</strong> envoie <strong>un seul</strong>{" "}
            message à <code>{COMMERCIAL_TEST_TO}</code> (brouillon + liste des{" "}
            {recipients.length} destinataire{recipients.length !== 1 ? "s" : ""}{" "}
            prévus). Aucune copie par personne.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={recipients.length > 0 ? "info" : "warning"}>
            {recipients.length} destinataire{recipients.length !== 1 ? "s" : ""}{" "}
            prévus
          </StatusPill>
          <StatusPill tone="success">Envoi → {COMMERCIAL_TEST_TO}</StatusPill>
        </div>

        {recipients.length > 0 && (
          <ul className="max-h-28 overflow-y-auto rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {recipients.slice(0, 40).map((r) => (
              <li key={r.email}>
                {r.name} — {r.email}
                {r.detail ? ` (${r.detail})` : ""}
              </li>
            ))}
            {recipients.length > 40 && (
              <li className="text-muted-foreground">
                … et {recipients.length - 40} autres
              </li>
            )}
          </ul>
        )}

        <div className="space-y-2">
          <Label htmlFor="stage-relance-subject">Sujet</Label>
          <Input
            id="stage-relance-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage-relance-body">Message</Label>
          <Textarea
            id="stage-relance-body"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copier
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={recipients.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
          <Button type="button" onClick={handleSend} disabled={!canSend}>
            {sending || sendEmail.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
