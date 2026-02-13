import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import fliLogo from "@/assets/fli-marca-black.png";

const authSchema = z.object({
  email: z.string().trim().email("Formato de email inválido").max(255, "Email muito longo"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72, "Senha muito longa"),
});

export function AuthCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: firstError.message,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao entrar",
          description: error.message === "Invalid login credentials" 
            ? "Email ou senha incorretos" 
            : error.message,
        });
      } else {
        setLoginSuccess(true);
        triggerConfetti();
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full shadow-2xl border border-white/20 bg-white/80 backdrop-blur-xl dark:bg-gray-900/70">
        <CardHeader className="space-y-4 text-center pb-2">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <img 
              src={fliLogo} 
              alt="FLI - France Langues International" 
              className="h-16 w-auto"
            />
          </motion.div>
          
          <AnimatePresence mode="wait">
            {loginSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <CardTitle className="text-2xl text-foreground">
                  Bem-vindo de volta
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Redirecionando para o painel...
                </CardDescription>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CardTitle className="text-2xl text-foreground">
                  Painel Administrativo
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Acesse sua conta para continuar
                </CardDescription>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-login" className="text-foreground">Email</Label>
              <motion.div whileHover={{ scale: 1.01 }} whileFocus={{ scale: 1.01 }}>
                <Input
                  id="email-login"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  required
                />
              </motion.div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-login" className="text-foreground">Senha</Label>
              <motion.div whileHover={{ scale: 1.01 }} whileFocus={{ scale: 1.01 }}>
                <Input
                  id="password-login"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  required
                />
              </motion.div>
            </div>

              <motion.div
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(20, 33, 61, 0.25)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-fli-navy hover:bg-fli-navy/90 text-white font-medium h-11"
                  disabled={isLoading || loginSuccess}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : loginSuccess ? (
                    "Sucesso"
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </motion.div>
            </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
