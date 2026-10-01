import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import fliLogo from "@/assets/fli-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard, IconChip } from "@/components/ui-kit";
import { dayPartLabel, type AttendanceDayPart } from "@/lib/attendance";
import { useAttendanceSlotByToken, useSignAttendance } from "@/hooks/useAttendance";

/**
 * Émargement public — action stagiaire obligatoire.
 * Sans chrome applicatif (comme /survey/:token).
 */
export default function EmargerPage() {
  const { token } = useParams<{ token: string }>();
  const { data: slot, isLoading, error } = useAttendanceSlotByToken(token);
  const sign = useSignAttendance();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<{
    already: boolean;
    firstName: string | null;
    signedAt: string;
  } | null>(null);

  const handleSign = async () => {
    if (!token) return;
    if (!email.trim() || !email.includes("@")) {
      toast.error("Indiquez l'e-mail utilisé lors de l'inscription");
      return;
    }
    try {
      const result = await sign.mutateAsync({ token, email: email.trim() });
      setDone({
        already: result.already_signed,
        firstName: result.student_first_name,
        signedAt: result.signed_at,
      });
      toast.success(
        result.already_signed ? "Présence déjà enregistrée" : "Présence enregistrée"
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Signature impossible";
      toast.error(message.replace(/^.*:\s*/, "") || message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-canvas))]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !slot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--surface-canvas))] p-6">
        <img src={fliLogo} alt="FLI" className="h-12 w-auto" />
        <p className="text-center text-muted-foreground">
          Lien d&apos;émargement invalide ou introuvable.
        </p>
      </div>
    );
  }

  const closed = slot.status !== "open";

  return (
    <div className="flex min-h-screen flex-col items-center bg-[hsl(var(--surface-canvas))] px-4 py-10">
      <img src={fliLogo} alt="FLI Formation" className="mb-6 h-14 w-auto" />
      <SurfaceCard
        className="w-full max-w-md"
        title={
          <span className="flex items-center gap-2">
            <IconChip icon={PenLine} tone="blue" />
            Émargement
          </span>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-lg font-medium">{slot.title || "Formation FLI"}</p>
            <p className="text-sm text-muted-foreground">
              {slot.slot_date} · {dayPartLabel(slot.day_part as AttendanceDayPart)}
            </p>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] bg-[hsl(var(--tint-green-bg))] p-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-[hsl(var(--tint-green-fg))]" />
              <p className="font-medium">
                {done.firstName ? `${done.firstName}, ` : ""}
                {done.already ? "votre présence était déjà enregistrée." : "présence enregistrée."}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(done.signedAt).toLocaleString("fr-FR")}
              </p>
            </div>
          ) : closed ? (
            <p className="text-sm text-muted-foreground">
              Ce créneau n&apos;accepte plus de signatures
              {slot.status === "instructor_validated" || slot.status === "admin_validated"
                ? " (déjà validé)."
                : "."}
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Confirmez votre présence avec l&apos;e-mail de votre inscription FLI.
              </p>
              <div className="space-y-2">
                <Label htmlFor="emarger-email">E-mail</Label>
                <Input
                  id="emarger-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSign();
                  }}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => void handleSign()}
                disabled={sign.isPending}
              >
                {sign.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PenLine className="mr-2 h-4 w-4" />
                )}
                Je suis présent·e
              </Button>
            </>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
