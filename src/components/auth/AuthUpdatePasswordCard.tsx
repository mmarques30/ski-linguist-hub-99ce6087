import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_HOME_PATH } from "@/lib/admin-home";
import {
  authValidationToastTitle,
  describeAuthError,
} from "@/lib/auth-copy";
import fliLogo from "@/assets/fli-marca-black.png";
import fliLogoDark from "@/assets/fli-marca-yellow.png";

const schema = z
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

export function AuthUpdatePasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = schema.safeParse({ password, confirm });
    if (!validation.success) {
      toast.error(authValidationToastTitle(), {
        description: validation.error.errors[0].message,
      });
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
      toast.success("Mot de passe mis à jour");
      navigate(ADMIN_HOME_PATH, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="fli-surface fli-glass overflow-hidden rounded-[var(--radius-panel)] border-border/60 p-6 shadow-xl sm:p-7">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <img
              src={fliLogo}
              alt="FLI - France Langues International"
              className="h-14 w-auto dark:hidden sm:h-16"
            />
            <img
              src={fliLogoDark}
              alt=""
              aria-hidden
              className="hidden h-14 w-auto dark:block sm:h-16"
            />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Choisis un mot de passe personnel (8 caractères minimum).
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="auth-new-password">Nouveau mot de passe</Label>
            <Input
              id="auth-new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-confirm-password">Confirmer</Label>
            <Input
              id="auth-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11"
              required
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={isLoading}>
            {isLoading ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
