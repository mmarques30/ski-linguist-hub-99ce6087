import { useState } from "react";
import { Check, Copy, Mail, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildContactMailto,
  CONTACT_DIALOG_COPY,
  FLI_CONTACT_ADDRESS,
  FLI_CONTACT_EMAIL,
  FLI_CONTACT_PHONE_DISPLAY,
  FLI_CONTACT_PHONE_TEL,
  type ContactDialogIntent,
} from "@/lib/landing-contact";

/** Copie synchrone via `execCommand`, pendant le geste utilisateur (sinon refusée). */
function legacyCopy(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * `execCommand` d'abord (synchrone, fiable dans un clic), puis l'API
 * presse-papiers bornée à 800 ms : sans permission, `writeText` peut rester
 * en attente indéfiniment et le bouton ne donnerait jamais de retour.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (legacyCopy(text)) return true;
  if (!navigator.clipboard?.writeText) return false;
  const timeout = new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 800));
  const write = navigator.clipboard.writeText(text).then(
    () => true,
    () => false
  );
  return Promise.race([write, timeout]);
}

interface ContactDialogProps {
  intent: ContactDialogIntent | null;
  onClose: () => void;
}

/**
 * Remplace les simples liens `mailto:` des CTA « Demander un devis » et
 * « Nous contacter » : sans client mail configuré (poste pro, mobile), un
 * `mailto:` ne fait rien. Ici l'adresse est lisible et copiable, le téléphone
 * cliquable, et le mail pré-rempli reste proposé.
 */
export function ContactDialog({ intent, onClose }: ContactDialogProps) {
  const [copied, setCopied] = useState(false);
  const effectiveIntent: ContactDialogIntent = intent ?? "question";
  const copy = CONTACT_DIALOG_COPY[effectiveIntent];

  const copyEmail = async () => {
    const ok = await copyToClipboard(FLI_CONTACT_EMAIL);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={intent !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="lp-root max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-[hsl(var(--fli-navy))]">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-[hsl(var(--fli-orange))]" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="truncate font-semibold text-foreground">{FLI_CONTACT_EMAIL}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
              aria-live="polite"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copier
                </>
              )}
            </button>
          </div>

          <a
            href={`tel:${FLI_CONTACT_PHONE_TEL}`}
            className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-muted/40 px-4 py-3 transition hover:bg-muted"
          >
            <Phone className="h-5 w-5 shrink-0 text-[hsl(var(--fli-orange))]" aria-hidden />
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p className="font-semibold text-foreground">{FLI_CONTACT_PHONE_DISPLAY}</p>
            </div>
          </a>
        </div>

        <a
          href={buildContactMailto(effectiveIntent)}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--fli-yellow))] px-5 py-3 text-sm font-semibold text-[hsl(var(--fli-navy))] transition hover:brightness-105"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Ouvrir un e-mail pré-rempli
        </a>
        <p className="text-center text-xs text-muted-foreground">{FLI_CONTACT_ADDRESS}</p>
      </DialogContent>
    </Dialog>
  );
}
