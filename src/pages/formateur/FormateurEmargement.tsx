import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardPen,
  Copy,
  ExternalLink,
  Loader2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  splitFormateurInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
  type FormateurInscriptionRow,
} from "@/hooks/useFormateurPortal";
import {
  buildAttendanceGroupKey,
  useAttendanceRecords,
  useAttendanceSlotsForInstructor,
  useMarkAttendanceAbsentExcuse,
  useOpenGroupAttendanceSlot,
  useOpenIndividualAttendanceSlot,
  useValidateAttendanceSlotInstructor,
  type AttendanceSlotRow,
} from "@/hooks/useAttendance";
import {
  ATTENDANCE_RECORD_LABELS,
  ATTENDANCE_SLOT_STATUS_LABELS,
  buildEmargerUrl,
  canInstructorValidateSlot,
  dayPartLabel,
  type AttendanceDayPart,
  type AttendanceRecordStatus,
  type AttendanceSlotStatus,
} from "@/lib/attendance";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { expectsStationGroupAssignment } from "@/lib/registration-group-notice";
import type { FliScheduleSlot } from "@/lib/fli-schedule-slots";

/** Collectif station (ou groupe nommé) → créneaux matin / après-midi. */
function isCollective(row: FormateurInscriptionRow): boolean {
  return expectsStationGroupAssignment(row.modality) || Boolean(row.group_name);
}

function SlotDetail({
  slot,
  onCopied,
}: {
  slot: AttendanceSlotRow;
  onCopied: () => void;
}) {
  const { data: records = [], isLoading } = useAttendanceRecords(slot.id);
  const mark = useMarkAttendanceAbsentExcuse();
  const validate = useValidateAttendanceSlotInstructor();
  const url = buildEmargerUrl(window.location.origin, slot.sign_token);
  const canValidate =
    slot.status === "open" && canInstructorValidateSlot(records.map((r) => ({ status: r.status })));

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    onCopied();
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={slot.status === "open" ? "success" : "neutral"} size="sm">
          {ATTENDANCE_SLOT_STATUS_LABELS[slot.status as AttendanceSlotStatus]}
        </StatusPill>
        <span className="text-xs text-muted-foreground">
          {slot.slot_date} · {dayPartLabel(slot.day_part as AttendanceDayPart)}
        </span>
      </div>
      {slot.status === "open" ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void copyLink()}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Copier le lien stagiaire
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Ouvrir
            </a>
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <TableSkeleton rows={3} cols={2} />
      ) : (
        <ul className="space-y-2">
          {records.map((r) => {
            const name = [r.students?.first_name, r.students?.last_name]
              .filter(Boolean)
              .join(" ");
            return (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{name || "Stagiaire"}</p>
                  <p className="text-xs text-muted-foreground">{r.inscriptions?.code}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    tone={
                      r.status === "present"
                        ? "success"
                        : r.status === "absent"
                          ? "danger"
                          : r.status === "excuse"
                            ? "warning"
                            : "neutral"
                    }
                    size="sm"
                  >
                    {ATTENDANCE_RECORD_LABELS[r.status as AttendanceRecordStatus]}
                  </StatusPill>
                  {slot.status === "open" && r.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mark.isPending}
                        onClick={() =>
                          void mark
                            .mutateAsync({
                              recordId: r.id,
                              status: "absent",
                              via: "instructor",
                            })
                            .then(() => toast.success("Marqué absent"))
                            .catch((e: Error) => toast.error(e.message))
                        }
                      >
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mark.isPending}
                        onClick={() =>
                          void mark
                            .mutateAsync({
                              recordId: r.id,
                              status: "excuse",
                              via: "instructor",
                            })
                            .then(() => toast.success("Marqué excusé"))
                            .catch((e: Error) => toast.error(e.message))
                        }
                      >
                        Excusé
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {slot.status === "open" ? (
        <Button
          size="sm"
          disabled={!canValidate || validate.isPending}
          onClick={() =>
            void validate
              .mutateAsync({ slotId: slot.id, records })
              .then(() => toast.success("Créneau validé — en attente de contre-signature"))
              .catch((e: Error) => toast.error(e.message))
          }
        >
          {validate.isPending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          )}
          Valider le créneau
        </Button>
      ) : null}
    </div>
  );
}

export default function FormateurEmargement() {
  const { data: profile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(profile?.id);
  const { data: slots = [], isLoading: loadingSlots } = useAttendanceSlotsForInstructor(
    profile?.id
  );
  const openIndividual = useOpenIndividualAttendanceSlot();
  const openGroup = useOpenGroupAttendanceSlot();
  const { current } = splitFormateurInscriptions(inscriptions);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const individual = current.filter((r) => !isCollective(r) && r.student_id);
  const collectives = useMemo(() => {
    const map = new Map<
      string,
      { key: string; title: string; members: FormateurInscriptionRow[] }
    >();
    for (const row of current.filter(isCollective)) {
      if (!row.student_id) continue;
      const key = buildAttendanceGroupKey({
        language: row.language,
        courseLocation: row.course_location,
        startDate: row.start_date,
        groupName: row.group_name,
        schedule: row.schedule,
      });
      const existing = map.get(key);
      if (existing) existing.members.push(row);
      else {
        map.set(key, {
          key,
          title: [
            displayLanguageLabel(row.language || ""),
            row.course_location,
            row.group_name,
          ]
            .filter(Boolean)
            .join(" · "),
          members: [row],
        });
      }
    }
    return [...map.values()];
  }, [current]);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? slots[0] ?? null;

  const startIndividual = async (row: FormateurInscriptionRow) => {
    if (!profile?.id || !row.student_id) return;
    try {
      const slot = await openIndividual.mutateAsync({
        instructorId: profile.id,
        inscriptionId: row.id,
        studentId: row.student_id,
        title: `${row.student_name || "Stagiaire"} · ${displayLanguageLabel(row.language || "")}`,
      });
      setSelectedSlotId(slot.id);
      const url = buildEmargerUrl(window.location.origin, slot.sign_token);
      await navigator.clipboard.writeText(url);
      toast.success("Créneau ouvert — lien copié");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ouverture impossible");
    }
  };

  const startGroup = async (
    group: { key: string; title: string; members: FormateurInscriptionRow[] },
    dayPart: FliScheduleSlot
  ) => {
    if (!profile?.id) return;
    try {
      const slot = await openGroup.mutateAsync({
        instructorId: profile.id,
        dayPart,
        slotDate: today,
        title: group.title,
        groupKey: group.key,
        members: group.members
          .filter((m) => m.student_id)
          .map((m) => ({ inscriptionId: m.id, studentId: m.student_id! })),
      });
      setSelectedSlotId(slot.id);
      await navigator.clipboard.writeText(
        buildEmargerUrl(window.location.origin, slot.sign_token)
      );
      toast.success(`Créneau ${dayPart} ouvert — lien copié`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ouverture impossible");
    }
  };

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Émargement"
          description="Ouvrez un créneau, partagez le lien, les stagiaires signent leur présence"
          icon={ClipboardPen}
          tone="blue"
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard title="Ouvrir un créneau">
            {isLoading ? (
              <TableSkeleton rows={4} cols={2} />
            ) : current.length === 0 ? (
              <TableEmpty title="Aucune formation en cours" />
            ) : (
              <div className="space-y-4">
                {collectives.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Collectif (au fil de l&apos;eau)
                    </p>
                    {collectives.map((g) => (
                      <div
                        key={g.key}
                        className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{g.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.members.length} stagiaire{g.members.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={openGroup.isPending}
                            onClick={() => void startGroup(g, "matin")}
                          >
                            <Play className="mr-1 h-3.5 w-3.5" /> Matin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={openGroup.isPending}
                            onClick={() => void startGroup(g, "apres-midi")}
                          >
                            <Play className="mr-1 h-3.5 w-3.5" /> Après-midi
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {individual.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Individuel (à la volée)
                    </p>
                    {individual.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {row.student_name || "Stagiaire"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.code} · {displayLanguageLabel(row.language || "")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={openIndividual.isPending}
                          onClick={() => void startIndividual(row)}
                        >
                          <Play className="mr-1 h-3.5 w-3.5" /> Démarrer le cours
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard
            title="Créneaux récents"
            actions={
              slots.length > 0 ? (
                <Select
                  value={selectedSlot?.id}
                  onValueChange={(v) => setSelectedSlotId(v)}
                >
                  <SelectTrigger className="w-[200px]" aria-label="Créneau">
                    <SelectValue placeholder="Créneau" />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.slot_date} · {s.title || dayPartLabel(s.day_part)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null
            }
          >
            {loadingSlots ? (
              <TableSkeleton rows={4} cols={2} />
            ) : !selectedSlot ? (
              <TableEmpty title="Aucun créneau ouvert" description="Ouvrez un créneau à gauche" />
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">{selectedSlot.title}</p>
                <SlotDetail
                  slot={selectedSlot}
                  onCopied={() => toast.success("Lien copié")}
                />
              </div>
            )}
          </SurfaceCard>
        </div>
      </PageShell>
    </FormateurPageShell>
  );
}
