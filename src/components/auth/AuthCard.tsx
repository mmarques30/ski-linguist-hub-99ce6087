import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/useAuth";
import { ADMIN_HOME_PATH } from "@/lib/admin-home";
import {
  authEmailLabel,
  authValidationToastTitle,
  describeAuthError,
} from "@/lib/auth-copy";
import fliLogo from "@/assets/fli-marca-black.png";
import fliLogoDark from "@/assets/fli-marca-yellow.png";

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide")
    .max(255, "Adresse e-mail trop longue"),
  password: z
    .string()
    .min(6, "Le mot de passe doit comporter au moins 6 caractères")
    .max(72, "Mot de passe trop long"),
});

export function AuthCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { signIn, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    const validation = authSchema.shape.email.safeParse(email);
    if (!validation.success) {
      toast.error("Saisis ton adresse e-mail pour réinitialiser ton mot de passe.");
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await resetPasswordForEmail(validation.data);
      if (error) {
        toast.error("Impossible d’envoyer le lien. Réessaie dans un instant.");
      } else {
        toast.success("Si un compte correspond à cette adresse, tu recevras un lien pour changer ton mot de passe.");
      }
    } catch {
      toast.error("Vérifie ta connexion et réessaie.");
    } finally {
      setIsResetting(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FCAF17", "#F58220", "#0095DA", "#00B5AD"],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(authValidationToastTitle(), { description: firstError.message });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("Connexion impossible", {
          description: describeAuthError(error.message),
        });
      } else {
        setLoginSuccess(true);
        triggerConfetti();
        setTimeout(() => {
          navigate(ADMIN_HOME_PATH);
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="mx-auto w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="fli-surface fli-glass overflow-hidden rounded-[var(--radius-panel)] border-border/60 p-6 shadow-xl sm:p-7">
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
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
          </motion.div>

          <AnimatePresence mode="wait">
            {loginSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Bienvenue
                </h1>
                <p className="text-sm text-muted-foreground">
                  Redirection vers le tableau de bord…
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1"
              >
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Administration FLI
                </h1>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous pour accéder au back-office
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email-login" className="text-foreground">
              {authEmailLabel()}
            </Label>
            <Input
              id="email-login"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="prenom@fli.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 transition-all duration-200"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-login" className="text-foreground">
              Mot de passe
            </Label>
            <Input
              id="password-login"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 transition-all duration-200"
              required
            />
          </div>

          <Button type="button" variant="link" className="h-auto px-0" onClick={handlePasswordReset}
            disabled={isResetting || isLoading || loginSuccess}>
            {isResetting ? "Envoi du lien…" : "Mot de passe oublié ?"}
          </Button>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              className="h-12 w-full text-base font-medium"
              disabled={isLoading || loginSuccess}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 rounded-pill border-2 border-current border-t-transparent"
                />
              ) : loginSuccess ? (
                "Connecté"
              ) : (
                "Se connecter"
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
