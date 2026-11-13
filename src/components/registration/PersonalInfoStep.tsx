import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRound } from "lucide-react";
import { toast } from "sonner";
import type { RegistrationData } from "@/pages/register/Index";
import {
  sanitizeFrenchPostalCodeInput,
  validatePersonalInfoFormats,
} from "@/lib/registration-personal-formats";
import { INVITE_ONLY_MESSAGE } from "@/lib/registration-offerings";
import { isPlausibleInviteEmail, normalizeInviteEmail } from "@/lib/registration-invite";
import { supabase } from "@/integrations/supabase/client";
import { StepActions, StepCard } from "./StepLayout";

interface PersonalInfoStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function PersonalInfoStep({ data, onUpdate, onNext }: PersonalInfoStepProps) {
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    const error = validatePersonalInfoFormats({
      email: data.email,
      postalCode: data.postalCode,
    });
    if (error) {
      toast.error(error);
      return;
    }

    if (data.inviteOnly && data.offeringId) {
      const email = normalizeInviteEmail(data.email);
      if (!isPlausibleInviteEmail(email)) {
        toast.error("Adresse e-mail invalide.");
        return;
      }
      setCheckingInvite(true);
      try {
        const { data: allowed, error: rpcError } = await supabase.rpc(
          "check_registration_invite",
          {
            p_offering_id: data.offeringId,
            p_email: email,
          }
        );
        if (rpcError) throw rpcError;
        if (!allowed) {
          setInviteError(
            "Cette adresse e-mail n'est pas sur la liste d'invitation pour cette session. Utilisez l'e-mail reçu dans le message FLI, ou contactez info@fli.fr."
          );
          toast.error("E-mail non autorisé pour cette session.");
          return;
        }
        onUpdate({ email });
      } catch (err) {
        console.error(err);
        toast.error("Vérification de l'invitation impossible. Réessayez ou contactez FLI.");
        return;
      } finally {
        setCheckingInvite(false);
      }
    }

    onNext();
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      <StepCard
        title="Informations personnelles"
        description={
          data.inviteOnly
            ? "Utilisez l'adresse e-mail de l'invitation FLI / ESF."
            : "Veuillez renseigner vos informations personnelles pour l'inscription"
        }
        icon={UserRound}
      >
        <div className="space-y-6">
          {data.inviteOnly && (
            <Alert>
              <AlertDescription>{INVITE_ONLY_MESSAGE}</AlertDescription>
            </Alert>
          )}
          {inviteError && (
            <Alert variant="destructive">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={data.firstName || ""}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                placeholder="Votre prénom"
                autoComplete="given-name"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={data.lastName || ""}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                placeholder="Votre nom"
                autoComplete="family-name"
                className="h-11"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={data.email || ""}
                onChange={(e) => {
                  setInviteError(null);
                  onUpdate({ email: e.target.value });
                }}
                placeholder="votre.email@exemple.com"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                title="Adresse e-mail avec un @"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (portable)</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={data.phone || ""}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+33 6 00 00 00 00"
                className="h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse en France</Label>
            <Input
              id="address"
              value={data.address || ""}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="Numéro et rue"
              autoComplete="street-address"
              className="h-11"
              required
            />
            <p className="text-xs text-muted-foreground">
              Merci d&apos;indiquer une adresse postale en France (code postal à 5 chiffres).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={data.postalCode || ""}
                onChange={(e) =>
                  onUpdate({ postalCode: sanitizeFrenchPostalCodeInput(e.target.value) })
                }
                placeholder="73000"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                pattern="\d{5}"
                title="5 chiffres"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={data.city || ""}
                onChange={(e) => onUpdate({ city: e.target.value })}
                placeholder="Nom de la ville"
                autoComplete="address-level2"
                className="h-11"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-sunken))] p-4">
            <div className="min-w-0">
              <p className="font-medium">Accessibilité handicap</p>
              <p className="text-sm text-muted-foreground">
                Avez-vous besoin d'aménagements spéciaux en raison d'un handicap ?
              </p>
            </div>
            <Switch
              checked={data.hasHandicap || false}
              onCheckedChange={(checked) => onUpdate({ hasHandicap: checked })}
              aria-label="Accessibilité handicap"
            />
          </div>
        </div>
      </StepCard>

      <StepActions>
        <Button
          type="submit"
          className="h-12 w-full text-base sm:w-auto"
          disabled={checkingInvite}
        >
          {checkingInvite
            ? "Vérification de l'invitation…"
            : "Continuer vers le profil professionnel"}
        </Button>
      </StepActions>
    </form>
  );
}
