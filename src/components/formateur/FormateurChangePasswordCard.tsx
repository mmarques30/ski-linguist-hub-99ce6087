import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui-kit/SurfaceCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { describeAuthError } from "@/lib/auth-copy";

export const passwordChangeSchema = z
  .object({
    password: z
      .string()
      .min(8, "Ton mot de passe doit comporter au moins 8 caractères.")
      .max(72, "Mot de passe trop long."),
    confirmation: z.string(),
  })
  .refine(({ password, confirmation }) => password === confirmation, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmation"],
  });

export function FormateurChangePasswordCard({
  title = "Mot de passe",
  onUpdated,
}: {
  title?: string;
  onUpdated?: () => void;
}) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    const validation = passwordChangeSchema.safeParse({ password, confirmation });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Vérifie ta saisie.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await updatePassword(validation.data.password);
      if (error) {
        toast.error("Mot de passe non modifié", {
          description: describeAuthError(error.message),
        });
        return;
      }
      setPassword("");
      setConfirmation("");
      toast.success("Ton mot de passe a été mis à jour.");
      onUpdated?.();
    } catch {
      toast.error("Mot de passe non modifié", {
        description: "Vérifie ta connexion et réessaie.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SurfaceCard title={title} icon={LockKeyhole}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Au moins 8 caractères. Tu peux afficher le mot de passe avec l’œil à droite.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirme ton mot de passe</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-auto min-h-11 max-w-full whitespace-normal"
        >
          {isLoading ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </SurfaceCard>
  );
}
