import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyLinkRowProps {
  label: string;
  description?: string;
  url: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

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
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{label}</p>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <code className="block text-xs break-all text-muted-foreground">{url}</code>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-600" />
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
