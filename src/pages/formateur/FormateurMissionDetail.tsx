import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  FileInput,
  FileOutput,
  Mail,
  MapPin,
  Phone,
  School,
} from "lucide-react";
import { FormateurPresenceDownloadButton } from "@/components/formateur/FormateurPresenceDownloadButton";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import { formatFormateurLevelDisplay } from "@/lib/formateur-formation-forms";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { getStatusLabel } from "@/lib/inscription-status";
import { displayLanguageLabel } from "@/lib/taught-languages";
import {
  DefinitionList,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export default function FormateurMissionDetail() {
  const { inscriptionId = "" } = useParams<{ inscriptionId: string }>();
  const { basePath } = useFormateurView();
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(
    profile?.id
  );

  const row = inscriptions.find((i) => i.id === inscriptionId) ?? null;
  const loading = loadingProfile || isLoading;
  const formateurName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "Formateur·rice";

  return (
    <FormateurPageShell>
      <PageShell width="narrow">
        <PageHeader
          title={row?.student_name || "Mission"}
          description={
            row
              ? [
                  row.language ? displayLanguageLabel(row.language) : null,
                  row.course_location,
                  inscriptionDateRangeLabel(row),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Détail de la mission"
          }
          icon={Calendar}
          tone="gold"
          actions={
            <div className="flex flex-wrap gap-2">
              {row ? (
                <FormateurPresenceDownloadButton
                  row={row}
                  formateurName={formateurName}
                />
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <Link to={`${basePath}/planning`}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Missions
                </Link>
              </Button>
            </div>
          }
        />

        {loading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={6} cols={2} />
          </SurfaceCard>
        ) : !row ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">
              Cette mission n&apos;est pas dans ton périmètre.
            </p>
            <Button className="mt-3" variant="outline" asChild>
              <Link to={`${basePath}/planning`}>Retour aux missions</Link>
            </Button>
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <SurfaceCard title="Mission">
              <DefinitionList
                columns={2}
                items={[
                  {
                    label: "Stagiaire",
                    value: row.student_name || "—",
                  },
                  {
                    label: "Dossier",
                    value: row.code || "—",
                  },
                  {
                    label: "Statut",
                    value: (
                      <StatusPill tone={toneForStatus(row.status)} size="sm">
                        {getStatusLabel(row.status || "", "fr")}
                      </StatusPill>
                    ),
                  },
                  {
                    label: "Langue",
                    value: row.language
                      ? displayLanguageLabel(row.language)
                      : "—",
                  },
                  {
                    label: "Période",
                    value: (
                      <span className="tabular">
                        {inscriptionDateRangeLabel(row)}
                      </span>
                    ),
                  },
                  {
                    label: "Horaires",
                    value: row.schedule || "—",
                  },
                  {
                    label: "Lieu",
                    value: row.course_location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                        {row.course_location}
                      </span>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Adresse",
                    value: row.course_address || "—",
                  },
                  {
                    label: "École",
                    value: row.ski_school_name ? (
                      <span className="inline-flex items-center gap-1">
                        <School className="h-3 w-3 shrink-0 text-muted-foreground" />
                        {row.ski_school_name}
                      </span>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Modalité",
                    value: [row.modality, row.rhythm].filter(Boolean).join(" · ") || "—",
                  },
                  {
                    label: "Durée prévue",
                    value:
                      row.duration_hours != null
                        ? `${row.duration_hours} h`
                        : "—",
                  },
                  {
                    label: "Groupe",
                    value: row.group_name || "—",
                  },
                ]}
              />
            </SurfaceCard>

            <SurfaceCard title="Contact stagiaire">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {row.student_email ? (
                  <a
                    href={`mailto:${row.student_email}`}
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {row.student_email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Pas d&apos;e-mail</span>
                )}
                {row.student_phone ? (
                  <a
                    href={`tel:${row.student_phone}`}
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {row.student_phone}
                  </a>
                ) : null}
                {row.student_id ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`${basePath}/stagiaires/${row.student_id}`}>
                      Fiche stagiaire
                    </Link>
                  </Button>
                ) : null}
              </div>
            </SurfaceCard>

            <SurfaceCard title="Niveaux (bilan)" icon={ClipboardList}>
              <DefinitionList
                columns={2}
                items={[
                  {
                    label: "Entrée — général",
                    value: formatFormateurLevelDisplay(row.niveau_general_entree),
                  },
                  {
                    label: "Entrée — technique",
                    value: formatFormateurLevelDisplay(
                      row.niveau_technique_entree
                    ),
                  },
                  {
                    label: "Sortie — général",
                    value: formatFormateurLevelDisplay(row.niveau_general_sortie),
                  },
                  {
                    label: "Sortie — technique",
                    value: formatFormateurLevelDisplay(
                      row.niveau_technique_sortie
                    ),
                  },
                ]}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`${basePath}/bilans/${row.id}/entree`}>
                    <FileInput className="mr-1.5 h-3.5 w-3.5" />
                    Formulaire d&apos;entrée
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`${basePath}/bilans/${row.id}/sortie`}>
                    <FileOutput className="mr-1.5 h-3.5 w-3.5" />
                    Formulaire de sortie
                  </Link>
                </Button>
              </div>
            </SurfaceCard>
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
