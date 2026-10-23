import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import {
  authValidationToastTitle,
  describeAuthError,
} from "@/lib/auth-copy";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit comporter au moins 8 caractères")
      .max(72, "Mot de passe trop long"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les deux saisies ne correspondent pas",
    path: ["confirm"],
  });

export function FormateurChangePasswordCard() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = passwordSchema.safeParse({ password, confirm });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(authValidationToastTitle(), { description: firstError.message });
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
      setConfirm("");
      toast.success("Mot de passe mis à jour");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SurfaceCard title="Mot de passe" icon={KeyRound}>
      <p className="mb-4 text-sm text-muted-foreground">
        Tu peux changer ton mot de passe à tout moment. Choisis-en un personnel (8
        caractères minimum).
      </p>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="space-y-2">
          <Label htmlFor="formateur-new-password">Nouveau mot de passe</Label>
          <Input
            id="formateur-new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="formateur-confirm-password">Confirmer</Label>
          <Input
            id="formateur-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading} className="h-11">
          {isLoading ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </SurfaceCard>
  );
}
