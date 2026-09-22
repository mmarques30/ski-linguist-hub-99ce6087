import { Button } from "@/components/ui/button";
import { KeyRound, Copy } from "lucide-react";
import { SurfaceCard } from "@/components/ui-kit";
import { toast } from "sonner";
import { ZZTEST_ROLE_LOGINS } from "@/lib/zztest-roles-logins";

export function ZztestRolesLoginsCard() {
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copié`);
    } catch {
      toast.error("Copie impossible");
    }
  };

  return (
    <SurfaceCard
      title={<>Logins de test — formateur &amp; stagiaire</>}
      icon={KeyRound}
      description={
        <>
          Rôles déjà en base (<code>formateur</code>, <code>student</code>). Ces comptes
          ZZTEST permettent de voir chaque espace. Emails @example.invalid : aucun envoi
          réel. Utilisez la carte Administration sur /auth (mot de passe), pas le magic
          link stagiaire.
        </>
      }
    >
      <div className="space-y-4">
        {ZZTEST_ROLE_LOGINS.map((account) => (
          <div key={account.email} className="space-y-2 rounded-[var(--radius)] border border-border p-4">
            <p className="font-semibold">{account.roleLabel}</p>
            <p className="text-sm text-muted-foreground">{account.howTo}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Email</span>
              <code className="rounded-[var(--radius-pill)] bg-[hsl(var(--surface-sunken))] px-2 py-0.5 ring-1 ring-inset ring-border">{account.email}</code>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Copier l'email ${account.email}`}
                onClick={() => void copy("Email", account.email)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Mot de passe</span>
              <code className="rounded-[var(--radius-pill)] bg-[hsl(var(--surface-sunken))] px-2 py-0.5 ring-1 ring-inset ring-border">{account.password}</code>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Copier le mot de passe de ${account.roleLabel}`}
                onClick={() => void copy("Mot de passe", account.password)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Accueil attendu : <code>{account.homePath}</code>
            </p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
