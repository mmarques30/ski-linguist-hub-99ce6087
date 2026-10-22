import { useState } from "react";
import { Link } from "react-router";
import { ClipboardPen, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import { AttendanceSlotPanel } from "@/components/formateur/AttendanceSlotPanel";
import { FormateurPresenceDownloadButton } from "@/components/formateur/FormateurPresenceDownloadButton";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  useAttendanceSlotsForInstructor,
  useOpenIndividualAttendanceSlot,
} from "@/hooks/useAttendance";
import {
  splitFormateurInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { getStatusLabel } from "@/lib/inscription-status";
import { displayLanguageLabel } from "@/lib/taught-languages";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";

function OpenEmargementButton({
  row,
  instructorId,
  isAssistMode,
  onOpened,
}: {
  row: FormateurInscriptionRow;
  instructorId: string;
  isAssistMode: boolean;
  onOpened: (slotId: string) => void;
}) {
  const open = useOpenIndividualAttendanceSlot();
  if (!row.student_id) return null;

  const handle = async () => {
    if (isAssistMode) {
      toast.message("Mode Assister : ouverture désactivée");
      return;
    }
    try {
      const title = [
        row.student_name || "Stagiaire",
        row.language ? displayLanguageLabel(row.language) : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const slot = await open.mutateAsync({
        instructorId,
        inscriptionId: row.id,
        studentId: row.student_id!,
        title,
        durationHours: row.duration_hours ?? 3,
      });
      toast.success("Séance ouverte — partage le lien avec le stagiaire");
      onOpened(slot.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ouverture impossible";
      toast.error(
        msg.includes("duplicate") || msg.includes("unique")
          ? "Une séance est déjà ouverte pour cette mission / horaire"
          : msg
      );
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      disabled={open.isPending || isAssistMode}
      onClick={handle}
    >
      {open.isPending ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Radio className="mr-1.5 h-3.5 w-3.5" />
      )}
      Ouvrir l&apos;émargement
    </Button>
  );
}

function PresenceMissionRow({
  row,
  formateurName,
  basePath,
  instructorId,
  isAssistMode,
  onOpened,
}: {
  row: FormateurInscriptionRow;
  formateurName: string;
  basePath: string;
  instructorId: string;
  isAssistMode: boolean;
  onOpened: (slotId: string) => void;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">
          {row.student_name || "Stagiaire"}
          {row.code ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {row.code}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground tabular">
          {inscriptionDateRangeLabel(row)}
          {row.language ? ` · ${displayLanguageLabel(row.language)}` : ""}
          {row.course_location ? ` · ${row.course_location}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <StatusPill tone={toneForStatus(row.status)} size="sm">
          {getStatusLabel(row.status || "", "fr")}
        </StatusPill>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`${basePath}/missions/${row.id}`}>Mission</Link>
        </Button>
        <OpenEmargementButton
          row={row}
          instructorId={instructorId}
          isAssistMode={isAssistMode}
          onOpened={onOpened}
        />
        <FormateurPresenceDownloadButton
          row={row}
          formateurName={formateurName}
        />
      </div>
    </li>
  );
}

export default function FormateurPresences() {
  const { basePath, isAssistMode } = useFormateurView();
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(
    profile?.id
  );
  const { data: slots = [], isLoading: loadingSlots } =
    useAttendanceSlotsForInstructor(profile?.id);
  const [focusSlotId, setFocusSlotId] = useState<string | null>(null);

  const { current, upcoming, past } = splitFormateurInscriptions(inscriptions);
  const formateurName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "Formateur·rice";

  const openSlots = slots.filter((s) => s.status === "open");
  const recentClosed = slots
    .filter((s) => s.status !== "open")
    .slice(0, 8);
  const selectedId =
    focusSlotId && slots.some((s) => s.id === focusSlotId)
      ? focusSlotId
      : openSlots[0]?.id ?? recentClosed[0]?.id ?? null;
  const selected = slots.find((s) => s.id === selectedId) ?? null;

  const missionSections: { title: string; rows: FormateurInscriptionRow[] }[] =
    [
      { title: "En cours", rows: current },
      { title: "À venir", rows: upcoming },
      { title: "Passées", rows: past.slice(0, 20) },
    ];

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title="Présence"
          description="Émargement numérique par séance — ou fiche PDF FORMATEUR en secours"
          icon={ClipboardPen}
          tone="blue"
        />

        <p className="text-xs text-muted-foreground">
          Ouvre une séance, envoie le lien aux stagiaires (ils signent avec
          leur e-mail d&apos;inscription), marque absents / excusés, puis
          clôture. La fiche PDF reste dispo si besoin papier.
        </p>

        {loadingSlots || loadingProfile ? (
          <SurfaceCard flush>
            <TableSkeleton rows={3} cols={2} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {openSlots.length > 0 || recentClosed.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[...openSlots, ...recentClosed].map((s) => (
                    <Button
                      key={s.id}
                      type="button"
                      size="sm"
                      variant={s.id === selectedId ? "default" : "outline"}
                      onClick={() => setFocusSlotId(s.id)}
                    >
                      {s.slot_date}
                      {s.status === "open" ? " · ouvert" : ""}
                    </Button>
                  ))}
                </div>
                {selected ? (
                  <AttendanceSlotPanel
                    slot={selected}
                    instructorName={formateurName}
                    isAssistMode={isAssistMode}
                  />
                ) : null}
              </div>
            ) : (
              <SurfaceCard>
                <p className="text-sm text-muted-foreground">
                  Aucune séance ouverte. Choisis une mission ci-dessous et
                  clique sur « Ouvrir l&apos;émargement ».
                </p>
              </SurfaceCard>
            )}
          </div>
        )}

        <h2 className="text-sm font-semibold">Missions — ouvrir / PDF</h2>

        {isLoading || loadingProfile ? (
          <SurfaceCard flush>
            <TableSkeleton rows={4} cols={3} />
          </SurfaceCard>
        ) : !profile?.id || inscriptions.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty title="Aucune mission — pas d'émargement à ouvrir." />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {missionSections.map((section) =>
              section.rows.length === 0 ? null : (
                <SurfaceCard
                  key={section.title}
                  title={`${section.title} (${section.rows.length})`}
                  flush
                >
                  <ul className="space-y-2 p-3">
                    {section.rows.map((row) => (
                      <PresenceMissionRow
                        key={row.id}
                        row={row}
                        formateurName={formateurName}
                        basePath={basePath}
                        instructorId={profile.id}
                        isAssistMode={isAssistMode}
                        onOpened={setFocusSlotId}
                      />
                    ))}
                  </ul>
                </SurfaceCard>
              )
            )}
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
