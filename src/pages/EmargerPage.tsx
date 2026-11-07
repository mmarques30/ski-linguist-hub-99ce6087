import { useState } from "react";
import { useParams } from "react-router";
import { CheckCircle2, ClipboardPen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAttendanceSlotByToken,
  useSignAttendance,
} from "@/hooks/useAttendance";
import {
  ATTENDANCE_DAY_PART_LABELS,
  ATTENDANCE_SLOT_STATUS_LABELS,
  type AttendanceDayPart,
  type AttendanceSlotStatus,
} from "@/lib/attendance";
import { PageHeader, PageShell, StatusPill, SurfaceCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import fliLogo from "@/assets/fli-logo.png";

export default function EmargerPage() {
  const { token = "" } = useParams<{ token: string }>();
  const { data: slot, isLoading, error, refetch } = useAttendanceSlotByToken(token);
  const sign = useSignAttendance();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<{
    already: boolean;
    firstName: string | null;
    signedAt: string;
  } | null>(null);

  const expired =
    slot?.sign_token_expires_at &&
    new Date(slot.sign_token_expires_at).getTime() < Date.now();
  const canSign = slot?.status === "open" && !expired;

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Indique ton e-mail d'inscription");
      return;
    }
    try {
      const result = await sign.mutateAsync({
        token,
        email: email.trim(),
      });
      setDone({
        already: result.already_signed,
        firstName: result.student_first_name,
        signedAt: result.signed_at,
      });
      await refetch();
      toast.success(
        result.already_signed
          ? "Tu étais déjà émargé·e pour cette séance"
          : "Présence enregistrée — merci !"
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Signature impossible";
      toast.error(
        msg.includes("introuvable") || msg.includes("email")
          ? "E-mail non reconnu pour cette séance — utilise celui de ton inscription FLI"
          : msg
      );
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-page))]">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-14 items-center gap-3 px-4">
          <img src={fliLogo} alt="FLI" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-muted-foreground">
            Émargement
          </span>
        </div>
      </header>

      <PageShell width="narrow" className="py-8">
        <PageHeader
          title="Signer ma présence"
          description="Confirme ta présence à la séance avec l'e-mail de ton inscription FLI"
          icon={ClipboardPen}
          tone="blue"
        />

        {isLoading ? (
          <SurfaceCard>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de la séance…
            </p>
          </SurfaceCard>
        ) : error || !slot ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">
              Lien invalide ou séance introuvable. Demande un nouveau lien à
              ton formateur·rice.
            </p>
          </SurfaceCard>
        ) : done ? (
          <SurfaceCard>
            <div className="flex flex-col items-start gap-3">
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--tint-teal-fg))]" />
              <p className="text-sm font-medium">
                {done.firstName
                  ? `Merci ${done.firstName} !`
                  : "Présence enregistrée"}
              </p>
              <p className="text-xs text-muted-foreground">
                {done.already
                  ? "Tu étais déjà signé·e pour cette séance."
                  : `Signé le ${new Date(done.signedAt).toLocaleString("fr-FR")}.`}
              </p>
            </div>
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <SurfaceCard title={slot.title || "Séance"}>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Date</dt>
                  <dd className="tabular">{slot.slot_date}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Créneau</dt>
                  <dd>
                    {ATTENDANCE_DAY_PART_LABELS[
                      slot.day_part as AttendanceDayPart
                    ] || slot.day_part}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Statut</dt>
                  <dd>
                    <StatusPill
                      tone={slot.status === "open" ? "success" : "neutral"}
                      size="sm"
                    >
                      {ATTENDANCE_SLOT_STATUS_LABELS[
                        slot.status as AttendanceSlotStatus
                      ] || slot.status}
                    </StatusPill>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Signatures</dt>
                  <dd className="tabular">
                    {slot.signed_count} signé
                    {slot.signed_count > 1 ? "s" : ""} · {slot.pending_count}{" "}
                    en attente
                  </dd>
                </div>
              </dl>
            </SurfaceCard>

            {!canSign ? (
              <SurfaceCard>
                <p className="text-sm text-muted-foreground">
                  {expired
                    ? "Ce lien a expiré. Demande un nouveau créneau à ton formateur·rice."
                    : "Cette séance n'accepte plus de signatures."}
                </p>
              </SurfaceCard>
            ) : (
              <SurfaceCard title="Ton e-mail d'inscription">
                <form onSubmit={handleSign} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="prenom@exemple.com"
                      required
                    />
                    <p className="text-2xs text-muted-foreground">
                      Utilise exactement l&apos;adresse connue de FLI.
                    </p>
                  </div>
                  <Button type="submit" disabled={sign.isPending}>
                    {sign.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Confirmer ma présence
                  </Button>
                </form>
              </SurfaceCard>
            )}
          </div>
        )}
      </PageShell>
    </div>
  );
}
