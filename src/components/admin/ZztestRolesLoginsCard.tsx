import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Copy } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Logins de test — formateur &amp; stagiaire
        </CardTitle>
        <CardDescription>
          Rôles déjà en base (<code>formateur</code>, <code>student</code>). Ces comptes
          ZZTEST permettent de voir chaque espace. Emails @example.invalid : aucun envoi
          réel. Utilisez la carte Administration sur /auth (mot de passe), pas le magic
          link stagiaire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ZZTEST_ROLE_LOGINS.map((account) => (
          <div key={account.email} className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">{account.roleLabel}</p>
            <p className="text-sm text-muted-foreground">{account.howTo}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Email</span>
              <code className="rounded bg-muted px-2 py-0.5">{account.email}</code>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void copy("Email", account.email)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Mot de passe</span>
              <code className="rounded bg-muted px-2 py-0.5">{account.password}</code>
              <Button
                type="button"
                size="sm"
                variant="ghost"
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
      </CardContent>
    </Card>
  );
}
