import { useMemo, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useOpenGroupAttendanceSlot } from "@/hooks/useAttendance";
import {
  listHalfDayOpenOptions,
  todayIsoDate,
  type HalfDayOpenOption,
} from "@/lib/attendance-formateur";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";
import { SurfaceCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AttendanceHalfDayOpenPanel({
  inscriptions,
  instructorId,
  isAssistMode,
  onOpened,
}: {
  inscriptions: FormateurInscriptionRow[];
  instructorId: string;
  isAssistMode: boolean;
  onOpened: (slotId: string) => void;
}) {
  const [slotDate, setSlotDate] = useState(todayIsoDate);
  const openGroup = useOpenGroupAttendanceSlot();
  const [busyId, setBusyId] = useState<string | null>(null);

  const options = useMemo(
    () => listHalfDayOpenOptions(inscriptions, slotDate),
    [inscriptions, slotDate]
  );

  const openOption = async (opt: HalfDayOpenOption) => {
    if (isAssistMode) {
      toast.message("Mode Assister : ouverture désactivée");
      return;
    }
    setBusyId(opt.id);
    try {
      const slot = await openGroup.mutateAsync({
        instructorId,
        dayPart: opt.dayPart,
        slotDate,
        title: opt.title,
        groupKey: opt.groupKey,
        members: opt.members.map((m) => ({
          inscriptionId: m.inscriptionId,
          studentId: m.studentId,
        })),
      });
      toast.success(
        opt.kind === "ensemble"
          ? "Séance « tous ensemble » ouverte — partage le lien"
          : "Séance demi-journée ouverte — partage le lien"
      );
      onOpened(slot.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ouverture impossible";
      toast.error(
        msg.includes("duplicate") || msg.includes("unique")
          ? "Ce créneau est déjà ouvert pour cette date"
          : msg
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SurfaceCard
      title="Émargement demi-journée"
      description="Lun–jeu : groupe matin / après-midi · vendredi : tous ensemble (si les 2 créneaux sont présents)"
      icon={Users}
    >
      <div className="space-y-4">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="slot-date">Date de la séance</Label>
          <Input
            id="slot-date"
            type="date"
            value={slotDate}
            onChange={(e) => setSlotDate(e.target.value)}
          />
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun groupe matin / après-midi détecté pour cette date (il faut
            des missions avec horaires FLI 8h30–12h30 ou 13h30–17h30). Tu peux
            toujours ouvrir un émargement individuel plus bas.
          </p>
        ) : (
          <ul className="space-y-2">
            {options.map((opt) => (
              <li
                key={opt.id}
                className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{opt.title}</p>
                  <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                  <p className="mt-1 text-2xs text-muted-foreground">
                    {opt.members
                      .slice(0, 6)
                      .map((m) => m.studentName)
                      .join(", ")}
                    {opt.members.length > 6
                      ? `… (+${opt.members.length - 6})`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isAssistMode || busyId === opt.id}
                  onClick={() => openOption(opt)}
                >
                  {busyId === opt.id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Ouvrir
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SurfaceCard>
  );
}
