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
  buildCommercialCampaignDigest,
  buildCommercialTestEnvelope,
  buildDirectorRelanceDraft,
  COMMERCIAL_TEST_TO,
  recipientsToCsv,
  type RelanceAudience,
  type StageFillAlumni,
  type StageFillDirector,
  type StageFillRow,
} from "@/lib/commercial-stage-fill";
import {
  isMassSendConfirmed,
  massSendNeedsConfirmation,
} from "@/lib/email-guards";
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
 * Envoi réel aux destinataires (skipNotifyBcc) + digest unique à info@fli.fr.
 * Bouton « Mail test » = 1 aperçu à info@fli.fr.
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
  const [confirmCount, setConfirmCount] = useState("");
  const [sending, setSending] = useState(false);

  const primary = rows[0] ?? null;
  const offerings = useMemo(() => rows.map((r) => r.offering), [rows]);

  const recipients = useMemo(() => {
    if (audience === "directeur") {
      return directors.map((d) => ({
        email: d.email,
        name: d.directeur?.trim() || d.nom_affiche,
        detail: d.nom_affiche,
        studentId: null as string | null,
        firstName: (d.directeur?.trim() || "").split(/\s+/)[0] ?? "",
      }));
    }
    return alumni.map((a) => ({
      email: a.email,
      name: `${a.firstName} ${a.lastName}`.trim(),
      detail: a.languageLabel,
      studentId: a.studentId,
      firstName: a.firstName,
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
    setConfirmCount("");
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
    const csv = recipientsToCsv(
      recipients.map((r) => ({
        email: r.email,
        name: r.name,
        detail: r.detail,
      }))
    );
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

  const confirmed = isMassSendConfirmed(
    recipients.length,
    Number.parseInt(confirmCount, 10) || null
  );

  const busy = sending || sendEmail.isPending;

  const canTest =
    canSendStaffEmail({ subject, bodyText }) &&
    recipients.length > 0 &&
    !busy;

  const canSend =
    canSendStaffEmail({ subject, bodyText }) &&
    recipients.length > 0 &&
    confirmed &&
    !busy;

  const personalizeBody = (recipient: (typeof recipients)[number]) => {
    if (audience !== "ancien") return bodyText;
    const templateFirst = (alumni[0]?.firstName ?? "").trim();
    const first = (recipient.firstName || recipient.name.split(/\s+/)[0] || "").trim();
    if (!templateFirst || !first || templateFirst === first) return bodyText;
    if (!bodyText.includes(templateFirst)) return bodyText;
    return bodyText.split(templateFirst).join(first);
  };

  const handleSendTest = async () => {
    if (!canTest) return;
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
      toast.success(`Mail test envoyé à ${COMMERCIAL_TEST_TO}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi test impossible");
    } finally {
      setSending(false);
    }
  };

  const handleSendAll = async () => {
    if (!canSend) return;
    setSending(true);
    const results: Array<{ email: string; name: string; ok: boolean }> = [];
    try {
      for (const recipient of recipients) {
        try {
          await sendEmail.mutateAsync({
            to: recipient.email,
            subject: subject.trim(),
            bodyText: personalizeBody(recipient),
            recipientName: recipient.name,
            studentId: recipient.studentId,
            templateSlug: "staff_manual",
            skipNotifyBcc: true,
          });
          results.push({ email: recipient.email, name: recipient.name, ok: true });
        } catch {
          results.push({ email: recipient.email, name: recipient.name, ok: false });
        }
      }

      const digest = buildCommercialCampaignDigest({
        audience,
        draftSubject: subject.trim(),
        sent: results,
        contextLabel:
          stationLabel ?? primary?.offering.location_label ?? primary?.offering.session_code,
      });
      try {
        await sendEmail.mutateAsync({
          to: COMMERCIAL_TEST_TO,
          subject: digest.subject,
          bodyText: digest.bodyText,
          recipientName: "FLI",
          templateSlug: "staff_manual",
        });
      } catch {
        toast.error("Campagne envoyée mais digest info@fli.fr en échec");
      }

      const ok = results.filter((r) => r.ok).length;
      const failed = results.length - ok;
      if (ok > 0) {
        toast.success(
          `${ok} e-mail${ok > 1 ? "s" : ""} envoyé${ok > 1 ? "s" : ""} → digest ${COMMERCIAL_TEST_TO}`
        );
      }
      if (failed > 0) toast.error(`${failed} échec${failed > 1 ? "s" : ""}`);
      if (failed === 0) onOpenChange(false);
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
            <strong>Envoyer</strong> = mail réel à chaque destinataire listé
            (sans BCC unitaire). Un <strong>digest</strong> unique part ensuite
            à <code>{COMMERCIAL_TEST_TO}</code>. « Mail test » = aperçu seul.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={recipients.length > 0 ? "info" : "warning"}>
            {recipients.length} destinataire{recipients.length !== 1 ? "s" : ""}
          </StatusPill>
          <StatusPill tone="success">Digest → {COMMERCIAL_TEST_TO}</StatusPill>
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

        {massSendNeedsConfirmation(recipients.length) && (
          <div className="space-y-2">
            <Label htmlFor="stage-relance-confirm">
              Confirmer le nombre de destinataires ({recipients.length})
            </Label>
            <Input
              id="stage-relance-confirm"
              inputMode="numeric"
              value={confirmCount}
              onChange={(e) => setConfirmCount(e.target.value)}
              placeholder={String(recipients.length)}
            />
          </div>
        )}

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
            <Button
              type="button"
              variant="outline"
              onClick={handleSendTest}
              disabled={!canTest}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Mail test
            </Button>
          </div>
          <Button type="button" onClick={handleSendAll} disabled={!canSend}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer ({recipients.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
