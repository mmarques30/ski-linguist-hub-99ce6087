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
  buildDirectorRelanceDraft,
  recipientsToCsv,
  type RelanceAudience,
  type StageFillAlumni,
  type StageFillDirector,
  type StageFillRow,
} from "@/lib/commercial-stage-fill";
import { isMassSendConfirmed, massSendNeedsConfirmation } from "@/lib/email-guards";
import { StatusPill } from "@/components/ui-kit";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: StageFillRow | null;
  audience: RelanceAudience;
  directors: StageFillDirector[];
  alumni: StageFillAlumni[];
  /** Envoi réel autorisé seulement après validation Paula des textes. */
  sendingUnlocked: boolean;
};

export function StageRelanceDialog({
  open,
  onOpenChange,
  row,
  audience,
  directors,
  alumni,
  sendingUnlocked,
}: Props) {
  const sendEmail = useSendStaffEmail();
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [confirmCount, setConfirmCount] = useState("");
  const [sending, setSending] = useState(false);

  const recipients = useMemo(() => {
    if (audience === "directeur") {
      return directors.map((d) => ({
        email: d.email,
        name: d.directeur?.trim() || d.nom_affiche,
        detail: d.nom_affiche,
        studentId: null as string | null,
      }));
    }
    return alumni.map((a) => ({
      email: a.email,
      name: `${a.firstName} ${a.lastName}`.trim(),
      detail: a.languageLabel,
      studentId: a.studentId,
    }));
  }, [audience, directors, alumni]);

  useEffect(() => {
    if (!open || !row) return;
    if (audience === "directeur") {
      const draft = buildDirectorRelanceDraft({
        offering: row.offering,
        directeurName: directors[0]?.directeur ?? null,
        enrolledCount: row.enrolledCount,
        minRequired: row.minRequired,
      });
      setSubject(draft.subject);
      setBodyText(draft.bodyText);
    } else {
      const draft = buildAlumniRelanceDraft({
        offering: row.offering,
        firstName: alumni[0]?.firstName ?? "",
      });
      setSubject(draft.subject);
      setBodyText(draft.bodyText);
    }
    setConfirmCount("");
  }, [open, row, audience, directors, alumni]);

  const title =
    audience === "directeur"
      ? "Relance directeurs"
      : "Relance anciens stagiaires";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${subject}\n\n${bodyText}`);
    toast.success("Brouillon copié");
  };

  const handleExport = () => {
    const csv = recipientsToCsv(
      recipients.map((r) => ({ email: r.email, name: r.name, detail: r.detail }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relance-${audience}-${row?.offering.session_code ?? "stage"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmed = isMassSendConfirmed(
    recipients.length,
    Number.parseInt(confirmCount, 10) || null
  );
  const canSend =
    sendingUnlocked &&
    canSendStaffEmail({ subject, bodyText }) &&
    recipients.length > 0 &&
    confirmed &&
    !sending &&
    !sendEmail.isPending;

  const handleSendAll = async () => {
    if (!canSend || !row) return;
    setSending(true);
    let ok = 0;
    let failed = 0;
    try {
      for (const recipient of recipients) {
        // Personnalise le prénom pour les anciens ; directeurs : texte commun.
        let personalizedBody = bodyText;
        if (audience === "ancien") {
          const first = recipient.name.split(" ")[0] ?? "";
          const draft = buildAlumniRelanceDraft({
            offering: row.offering,
            firstName: first,
          });
          personalizedBody = draft.bodyText;
        } else if (audience === "directeur") {
          const draft = buildDirectorRelanceDraft({
            offering: row.offering,
            directeurName: recipient.name,
            enrolledCount: row.enrolledCount,
            minRequired: row.minRequired,
          });
          personalizedBody = draft.bodyText;
        }
        try {
          await sendEmail.mutateAsync({
            to: recipient.email,
            subject: subject.trim(),
            bodyText: personalizedBody,
            recipientName: recipient.name,
            studentId: recipient.studentId,
            templateSlug: "staff_manual",
          });
          ok += 1;
        } catch {
          failed += 1;
        }
      }
      if (ok > 0) toast.success(`${ok} e-mail${ok > 1 ? "s" : ""} envoyé${ok > 1 ? "s" : ""}`);
      if (failed > 0) toast.error(`${failed} échec${failed > 1 ? "s" : ""} d'envoi`);
      if (failed === 0) onOpenChange(false);
    } finally {
      setSending(false);
    }
  };

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {row.offering.session_code} · {row.offering.location_label} ·{" "}
            {row.offering.language_label} — {row.enrolledCount}/{row.minRequired} inscrit·es
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription>
            Aucun envoi automatique. Les textes sont des brouillons : validez-les avec Paula
            avant de débloquer l'envoi. En attendant, exportez la liste ou copiez le message.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={recipients.length > 0 ? "info" : "warning"}>
            {recipients.length} destinataire{recipients.length !== 1 ? "s" : ""}
          </StatusPill>
          {!sendingUnlocked && (
            <StatusPill tone="warning">Envoi verrouillé — validation requise</StatusPill>
          )}
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
              <li className="text-muted-foreground">… et {recipients.length - 40} autres</li>
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
            rows={14}
            className="font-mono text-sm"
          />
        </div>

        {sendingUnlocked && massSendNeedsConfirmation(recipients.length) && (
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
          </div>
          <Button type="button" onClick={handleSendAll} disabled={!canSend}>
            {sending || sendEmail.isPending ? (
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
