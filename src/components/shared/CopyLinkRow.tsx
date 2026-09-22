import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";

interface CopyLinkRowProps {
  label: string;
  description?: string;
  url: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

/** Teinte de pastille équivalente à l'ancienne variante de Badge. */
const TONE_BY_VARIANT: Record<
  NonNullable<CopyLinkRowProps["badgeVariant"]>,
  PillTone
> = {
  default: "info",
  secondary: "neutral",
  outline: "neutral",
  destructive: "danger",
};

export function CopyLinkRow({
  label,
  description,
  url,
  badge,
  badgeVariant = "secondary",
}: CopyLinkRowProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <div className="fli-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{label}</p>
          {badge && (
            <StatusPill tone={TONE_BY_VARIANT[badgeVariant]} size="sm">
              {badge}
            </StatusPill>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <code className="block break-all rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] px-2 py-1 text-xs text-muted-foreground">
          {url}
        </code>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-[hsl(var(--status-good))]" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copier
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir
          </a>
        </Button>
      </div>
    </div>
  );
}
