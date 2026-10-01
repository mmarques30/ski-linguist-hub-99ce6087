import { useState } from "react";
import { CheckCircle2, ClipboardPen, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
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
  useAttendanceRecords,
  useAttendanceSlotsPendingAdmin,
  useCountersignAttendanceSlot,
  useMarkAttendanceAbsentExcuse,
  type AttendanceSlotRow,
} from "@/hooks/useAttendance";
import {
  ATTENDANCE_RECORD_LABELS,
  dayPartLabel,
  type AttendanceDayPart,
  type AttendanceRecordStatus,
} from "@/lib/attendance";
import { downloadAttendanceSheetPdf } from "@/lib/attendance-pdf";

function AdminSlotCard({ slot }: { slot: AttendanceSlotRow }) {
  const { data: records = [], isLoading } = useAttendanceRecords(slot.id);
  const countersign = useCountersignAttendanceSlot();
  const mark = useMarkAttendanceAbsentExcuse();

  const exportPdf = () => {
    downloadAttendanceSheetPdf({
      title: slot.title || "Formation FLI",
      slotDate: slot.slot_date,
      dayPart: slot.day_part as AttendanceDayPart,
      rows: records.map((r) => ({
        studentName: [r.students?.first_name, r.students?.last_name]
          .filter(Boolean)
          .join(" "),
        status: r.status,
        signedAt: r.signed_at,
        note: r.note,
      })),
      instructorValidatedAt: slot.instructor_validated_at,
      adminValidatedAt: slot.admin_validated_at,
    });
  };

  return (
    <SurfaceCard
      title={slot.title || "Créneau"}
      actions={
        <StatusPill tone="warning" size="sm">
          À contre-signer
        </StatusPill>
      }
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {slot.slot_date} · {dayPartLabel(slot.day_part as AttendanceDayPart)}
      </p>
      {isLoading ? (
        <TableSkeleton rows={3} cols={2} />
      ) : (
        <ul className="mb-4 space-y-2">
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
                          : "warning"
                    }
                    size="sm"
                  >
                    {ATTENDANCE_RECORD_LABELS[r.status as AttendanceRecordStatus]}
                  </StatusPill>
                  {r.status === "present" ? (
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
                              via: "admin",
                            })
                            .then(() => toast.success("Corrigé : absent"))
                            .catch((e: Error) => toast.error(e.message))
                        }
                      >
                        → Absent
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
                              via: "admin",
                            })
                            .then(() => toast.success("Corrigé : excusé"))
                            .catch((e: Error) => toast.error(e.message))
                        }
                      >
                        → Excusé
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={countersign.isPending}
          onClick={() =>
            void countersign
              .mutateAsync(slot.id)
              .then(() => toast.success("Créneau contre-signé"))
              .catch((e: Error) => toast.error(e.message))
          }
        >
          {countersign.isPending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          )}
          Contre-signer
        </Button>
        <Button size="sm" variant="outline" onClick={exportPdf}>
          <Download className="mr-1 h-3.5 w-3.5" /> PDF feuille
        </Button>
      </div>
    </SurfaceCard>
  );
}

export default function EmargementAdmin() {
  const { data: slots = [], isLoading } = useAttendanceSlotsPendingAdmin();
  const [showAllHint] = useState(true);

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Émargement"
          description="Contre-signature des feuilles validées par les formateurs"
          icon={ClipboardPen}
          tone="blue"
        />
        {showAllHint ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Un créneau n&apos;apparaît ici qu&apos;après validation formateur. Le taux
            d&apos;assiduité du dossier se calcule uniquement sur les créneaux
            contre-signés (excuse = présent).
          </p>
        ) : null}
        {isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : slots.length === 0 ? (
          <SurfaceCard>
            <TableEmpty
              title="Rien à contre-signer"
              description="Les créneaux validés par les formateurs apparaîtront ici"
            />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => (
              <AdminSlotCard key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </PageShell>
    </MainLayout>
  );
}
