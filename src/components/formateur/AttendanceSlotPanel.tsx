import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AttendanceSignLink } from "@/components/formateur/AttendanceSignLink";
import {
  useAttendanceRecords,
  useMarkAttendanceAbsentExcuse,
  useValidateAttendanceSlotInstructor,
  type AttendanceSlotRow,
} from "@/hooks/useAttendance";
import {
  ATTENDANCE_DAY_PART_LABELS,
  ATTENDANCE_RECORD_LABELS,
  ATTENDANCE_SLOT_STATUS_LABELS,
  canInstructorValidateSlot,
} from "@/lib/attendance";
import { downloadAttendanceSheetPdf } from "@/lib/attendance-pdf";
import { StatusPill, SurfaceCard, TableSkeleton } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

function recordTone(
  status: string
): "success" | "warning" | "danger" | "neutral" {
  if (status === "present") return "success";
  if (status === "pending") return "warning";
  if (status === "absent") return "danger";
  return "neutral";
}

export function AttendanceSlotPanel({
  slot,
  instructorName,
  isAssistMode,
}: {
  slot: AttendanceSlotRow;
  instructorName: string;
  isAssistMode?: boolean;
}) {
  const { data: records = [], isLoading } = useAttendanceRecords(slot.id);
  const mark = useMarkAttendanceAbsentExcuse();
  const validate = useValidateAttendanceSlotInstructor();
  const open = slot.status === "open";
  const canClose = open && canInstructorValidateSlot(records);

  const studentName = (r: (typeof records)[0]) => {
    const s = r.students;
    if (!s) return "Stagiaire";
    return `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Stagiaire";
  };

  const downloadPdf = () => {
    downloadAttendanceSheetPdf({
      title: slot.title || "Séance",
      slotDate: slot.slot_date,
      dayPart: slot.day_part,
      instructorName,
      rows: records.map((r) => ({
        studentName: studentName(r),
        status: r.status,
        signedAt: r.signed_at,
        note: r.note,
      })),
      instructorValidatedAt: slot.instructor_validated_at,
      adminValidatedAt: slot.admin_validated_at,
    });
    toast.success("Feuille d'émargement téléchargée");
  };

  const markStatus = async (recordId: string, status: "absent" | "excuse") => {
    if (isAssistMode) {
      toast.message("Mode Assister : modification désactivée");
      return;
    }
    try {
      await mark.mutateAsync({ recordId, status, via: "instructor" });
      toast.success(status === "absent" ? "Marqué absent" : "Marqué excusé");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Mise à jour impossible");
    }
  };

  const closeSlot = async () => {
    if (isAssistMode) {
      toast.message("Mode Assister : clôture désactivée");
      return;
    }
    try {
      await validate.mutateAsync({ slotId: slot.id, records });
      toast.success("Séance clôturée (validation formateur)");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Clôture impossible");
    }
  };

  return (
    <SurfaceCard
      title={slot.title || "Séance"}
      description={`${slot.slot_date} · ${
        ATTENDANCE_DAY_PART_LABELS[slot.day_part] || slot.day_part
      }`}
      actions={
        <StatusPill
          tone={
            slot.status === "open"
              ? "success"
              : slot.status === "instructor_validated"
                ? "info"
                : "neutral"
          }
          size="sm"
        >
          {ATTENDANCE_SLOT_STATUS_LABELS[slot.status] || slot.status}
        </StatusPill>
      }
    >
      <div className="space-y-4">
        {open ? (
          <AttendanceSignLink
            token={slot.sign_token}
            expiresAt={slot.sign_token_expires_at}
          />
        ) : null}

        {isLoading ? (
          <TableSkeleton rows={3} cols={3} />
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-[var(--radius)] border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{studentName(r)}</p>
                  <p className="text-2xs text-muted-foreground">
                    {r.inscriptions?.code || ""}
                    {r.signed_at
                      ? ` · ${new Date(r.signed_at).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={recordTone(r.status)} size="sm">
                    {ATTENDANCE_RECORD_LABELS[r.status] || r.status}
                  </StatusPill>
                  {open && r.status === "pending" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={mark.isPending || isAssistMode}
                        onClick={() => markStatus(r.id, "excuse")}
                      >
                        Excusé
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={mark.isPending || isAssistMode}
                        onClick={() => markStatus(r.id, "absent")}
                      >
                        Absent
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            PDF séance
          </Button>
          {open ? (
            <Button
              type="button"
              size="sm"
              disabled={!canClose || validate.isPending || isAssistMode}
              onClick={closeSlot}
            >
              {validate.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Clôturer la séance
            </Button>
          ) : null}
        </div>
        {open && !canClose ? (
          <p className="text-2xs text-muted-foreground">
            Pour clôturer : chaque stagiaire doit avoir signé, ou être marqué
            absent / excusé.
          </p>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
