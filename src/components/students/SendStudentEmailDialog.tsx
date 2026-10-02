import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSendStaffEmail } from "@/hooks/useSendStaffEmail";
import { canSendStaffEmail } from "@/lib/staff-email";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  to: string;
  recipientName: string;
  studentId?: string | null;
  inscriptionId?: string | null;
  /** Préremplissage optionnel (ex. rappel paiement). */
  defaultSubject?: string;
  defaultBody?: string;
};

/**
 * Composer d'e-mail staff → stagiaire (envoi Resend via edge send-staff-email).
 */
export function SendStudentEmailDialog({
  open,
  onOpenChange,
  to,
  recipientName,
  studentId,
  inscriptionId,
  defaultSubject = "",
  defaultBody = "",
}: Props) {
  const sendEmail = useSendStaffEmail();
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyText, setBodyText] = useState(defaultBody);

  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setBodyText(
        defaultBody ||
          `Bonjour ${recipientName.split(" ")[0] || recipientName},\n\n`
      );
    }
  }, [open, defaultSubject, defaultBody, recipientName]);

  const canSend = canSendStaffEmail({ subject, bodyText }) && !sendEmail.isPending;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await sendEmail.mutateAsync({
        to,
        subject: subject.trim(),
        bodyText,
        recipientName,
        studentId: studentId ?? null,
        inscriptionId: inscriptionId ?? null,
      });
      toast.success(`E-mail envoyé à ${to}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Écrire à {recipientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <Input value={to} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email-subject">Sujet</Label>
            <Input
              id="staff-email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="Sujet du message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email-body">Message</Label>
            <Textarea
              id="staff-email-body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={12}
              maxLength={20000}
              placeholder="Votre message…"
              className="min-h-[220px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Expéditeur FLI (noreply@fli.fr) — les réponses arrivent sur info@fli.fr.
              Le pied de page FLI est ajouté automatiquement.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSend} disabled={!canSend}>
            {sendEmail.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
