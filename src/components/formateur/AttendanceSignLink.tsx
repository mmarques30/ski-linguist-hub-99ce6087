import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { buildEmargerUrl } from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttendanceSignLink({
  token,
  expiresAt,
}: {
  token: string;
  expiresAt?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const url = buildEmargerUrl(window.location.origin, token);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible — sélectionne le lien");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Lien pour les stagiaires
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            value={url}
            className="pl-8 font-mono text-xs"
            onFocus={(e) => e.target.select()}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5" />
          )}
          Copier
        </Button>
      </div>
      {expiresAt ? (
        <p className="text-2xs text-muted-foreground tabular">
          Valide jusqu&apos;au{" "}
          {new Date(expiresAt).toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      ) : null}
    </div>
  );
}
