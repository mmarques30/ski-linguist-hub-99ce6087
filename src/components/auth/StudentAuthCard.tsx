import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { IconChip } from "@/components/ui-kit";
import fliLogo from "@/assets/fli-marca-black.png";
import fliLogoDark from "@/assets/fli-marca-yellow.png";

const emailSchema = z.object({
  email: z.string().trim().email("Format d'email invalide"),
});

export function StudentAuthCard() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signInWithMagicLink } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Email invalide",
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      } else {
        setSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fli-surface fli-glass mx-auto w-full max-w-md rounded-[var(--radius-panel)] border-border/60 p-6 shadow-xl sm:p-7">
      <div className="space-y-4 text-center">
        <img src={fliLogo} alt="FLI" className="mx-auto h-12 w-auto dark:hidden" />
        <img
          src={fliLogoDark}
          alt=""
          aria-hidden
          className="mx-auto hidden h-12 w-auto dark:block"
        />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Espace stagiaire
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous avec le lien reçu par email, ou demandez un nouveau lien ci-dessous.
          </p>
        </div>
      </div>

      <div className="mt-6">
        {sent ? (
          <div className="flex gap-3 rounded-[var(--radius-card)] border border-[hsl(var(--tint-teal-ring))] bg-[hsl(var(--tint-teal-bg))] p-4">
            <IconChip icon={Mail} tone="teal" size="sm" />
            <p className="min-w-0 text-sm text-foreground">
              Si un compte existe pour <strong className="break-all">{email}</strong>, vous
              recevrez un email avec un lien de connexion sécurisé. Vérifiez vos spams.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                inputMode="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Recevoir un lien de connexion
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
