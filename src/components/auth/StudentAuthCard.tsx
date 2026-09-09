import { useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import fliLogo from "@/assets/fli-marca-black.png";

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-4">
        <img src={fliLogo} alt="FLI" className="h-12 mx-auto" />
        <div>
          <CardTitle>Espace stagiaire</CardTitle>
          <CardDescription>
            Connectez-vous avec le lien reçu par email, ou demandez un nouveau lien ci-dessous.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sent ? (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Si un compte existe pour <strong>{email}</strong>, vous recevrez un email avec un lien
              de connexion sécurisé. Vérifiez vos spams.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Recevoir un lien de connexion
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
