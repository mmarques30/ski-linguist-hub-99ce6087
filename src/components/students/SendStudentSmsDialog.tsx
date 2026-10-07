import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSendStaffSms } from "@/hooks/useSendStaffSms";
import {
  BREVO_SMS_SENDER,
  buildStaffSmsTemplate,
  canSendStaffSms,
  MAX_SMS_CONTENT,
  normalizePhoneForSms,
  smsCharCount,
  STAFF_SMS_TEMPLATE_OPTIONS,
  type StaffSmsTemplateId,
} from "@/lib/staff-sms";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  recipientName: string;
  studentId?: string | null;
  inscriptionId?: string | null;
  defaultTemplate?: StaffSmsTemplateId;
};

/**
 * Composer SMS staff → stagiaire (envoi Brevo via edge send-staff-sms).
 */
export function SendStudentSmsDialog({
  open,
  onOpenChange,
  phone,
  recipientName,
  studentId,
  inscriptionId,
  defaultTemplate = "mailCheck",
}: Props) {
  const sendSms = useSendStaffSms();
  const firstName = recipientName.split(" ")[0] || recipientName;
  const normalized = useMemo(() => normalizePhoneForSms(phone), [phone]);

  const [templateId, setTemplateId] =
    useState<StaffSmsTemplateId>(defaultTemplate);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;
    setTemplateId(defaultTemplate);
    const built = buildStaffSmsTemplate(defaultTemplate, { firstName });
    setContent(built.content);
  }, [open, defaultTemplate, firstName]);

  const applyTemplate = (id: StaffSmsTemplateId) => {
    setTemplateId(id);
    const built = buildStaffSmsTemplate(id, { firstName });
    setContent(built.content);
  };

  const slug = buildStaffSmsTemplate(templateId, { firstName }).slug;
  const chars = smsCharCount(content);
  const canSend =
    canSendStaffSms({ to: normalized, content }) && !sendSms.isPending;

  const handleSend = async () => {
    if (!canSend || !normalized) return;
    try {
      const result = await sendSms.mutateAsync({
        to: normalized,
        content,
        templateSlug: slug,
        recipientName,
        studentId: studentId ?? null,
        inscriptionId: inscriptionId ?? null,
      });
      toast.success(`SMS envoyé à ${result.to}`);
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
            <MessageSquare className="h-4 w-4" />
            SMS à {recipientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <Input
              value={normalized ?? phone}
              readOnly
              className="bg-muted"
            />
            {!normalized ? (
              <p className="text-xs text-destructive">
                Numéro invalide — corrigez le téléphone sur la fiche stagiaire.
              </p>
            ) : phone.trim() !== normalized ? (
              <p className="text-xs text-muted-foreground">
                Normalisé pour Brevo : {normalized}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Modèle</Label>
            <Select
              value={templateId}
              onValueChange={(v) => applyTemplate(v as StaffSmsTemplateId)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_SMS_TEMPLATE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-sms-body">Message</Label>
            <Textarea
              id="staff-sms-body"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={MAX_SMS_CONTENT}
              className="min-h-[140px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Expéditeur {BREVO_SMS_SENDER} via Brevo · {chars}/{MAX_SMS_CONTENT}{" "}
              caractères
              {chars > 160
                ? " (accents → plusieurs segments possibles)"
                : ""}
              .
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSend} disabled={!canSend}>
            {sendSms.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Envoyer le SMS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
