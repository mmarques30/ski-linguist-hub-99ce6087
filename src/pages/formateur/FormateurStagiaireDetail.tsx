import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ClipboardList,
  FileInput,
  FileOutput,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { PlacementTestSummaryCard } from "@/components/inscriptions/PlacementTestSummaryCard";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  uniqueStagiairesFromInscriptions,
  useFormateurInscriptions,
  useFormateurProfile,
  type FormateurInscriptionRow,
} from "@/hooks/useFormateurPortal";
import {
  formatFormateurLevelDisplay,
  resolveFormulaireEntree,
} from "@/lib/formateur-formation-forms";
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

function attentesFromFormulaire(row: FormateurInscriptionRow): string | null {
  const form = resolveFormulaireEntree(row.formulaire_entree, {
    niveau_general_entree: row.niveau_general_entree,
    niveau_technique_entree: row.niveau_technique_entree,
    remarques_entree: row.remarques_entree,
  });
  const text =
    form.type_formation === "collective"
      ? form.attentes_groupe?.trim()
      : form.attentes_stagiaire?.trim();
  return text || null;
}

function MissionPedagogieBlock({
  row,
  basePath,
}: {
  row: FormateurInscriptionRow;
  basePath: string;
}) {
  const attentesInscription = row.expectations?.trim() || null;
  const attentesFormateur = attentesFromFormulaire(row);
  const hasAttentes = Boolean(attentesInscription || attentesFormateur);
  const hasTest = Boolean(row.entry_test_id || row.entry_test_score);

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">
            {row.code || "Mission"}
            {row.language ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {displayLanguageLabel(row.language)}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground tabular">
            {inscriptionDateRangeLabel(row)}
            {row.course_location ? ` · ${row.course_location}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={toneForStatus(row.status)} size="sm">
            {getStatusLabel(row.status || "", "fr")}
          </StatusPill>
          <Button variant="outline" size="sm" asChild>
            <Link to={`${basePath}/missions/${row.id}`}>Voir la mission</Link>
          </Button>
        </div>
      </div>

      <SurfaceCard title="Attentes" flush={!hasAttentes}>
        {hasAttentes ? (
          <DefinitionList
            columns={1}
            items={[
              ...(attentesInscription
                ? [
                    {
                      label: "Attentes du stagiaire (inscription)",
                      value: (
                        <p className="whitespace-pre-wrap text-sm">
                          {attentesInscription}
                        </p>
                      ),
                    },
                  ]
                : []),
              ...(attentesFormateur
                ? [
                    {
                      label: "Attentes notées en bilan d'entrée",
                      value: (
                        <p className="whitespace-pre-wrap text-sm">
                          {attentesFormateur}
                        </p>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        ) : (
          <p className="p-3 text-sm text-muted-foreground">
            Pas encore d&apos;attentes renseignées pour cette mission.
          </p>
        )}
      </SurfaceCard>

      {hasTest ? (
        <PlacementTestSummaryCard
          testId={row.entry_test_id}
          fallbackScore={row.entry_test_score}
          editable={false}
          inscriptionEntryLevel={row.entry_level}
        />
      ) : (
        <SurfaceCard title="Test de placement">
          <p className="text-sm text-muted-foreground">
            Aucun test de placement lié à cette mission.
          </p>
        </SurfaceCard>
      )}

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
              value: formatFormateurLevelDisplay(row.niveau_technique_entree),
            },
            {
              label: "Sortie — général",
              value: formatFormateurLevelDisplay(row.niveau_general_sortie),
            },
            {
              label: "Sortie — technique",
              value: formatFormateurLevelDisplay(row.niveau_technique_sortie),
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
  );
}

export default function FormateurStagiaireDetail() {
  const { studentId = "" } = useParams<{ studentId: string }>();
  const { basePath } = useFormateurView();
  const { data: profile, isLoading: loadingProfile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading } = useFormateurInscriptions(
    profile?.id
  );

  const stagiaires = uniqueStagiairesFromInscriptions(inscriptions);
  const stagiaire =
    stagiaires.find((s) => s.studentId === studentId) ??
    (studentId.startsWith("anon:")
      ? stagiaires.find((s) => s.studentId === studentId)
      : null);

  const missions = stagiaire?.inscriptions ?? [];
  const first = missions[0];
  const loading = loadingProfile || isLoading;

  return (
    <FormateurPageShell>
      <PageShell width="narrow">
        <PageHeader
          title={stagiaire?.name || "Stagiaire"}
          description={
            stagiaire
              ? `${missions.length} mission${missions.length > 1 ? "s" : ""} — contact, attentes, test et niveaux`
              : "Fiche stagiaire"
          }
          icon={Users}
          tone="blue"
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/stagiaires`}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Stagiaires
              </Link>
            </Button>
          }
        />

        {loading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={6} cols={2} />
          </SurfaceCard>
        ) : !stagiaire ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">
              Ce stagiaire n&apos;est pas dans ton périmètre.
            </p>
            <Button className="mt-3" variant="outline" asChild>
              <Link to={`${basePath}/stagiaires`}>Retour aux stagiaires</Link>
            </Button>
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <SurfaceCard title="Contact">
              <DefinitionList
                columns={2}
                items={[
                  { label: "Nom", value: stagiaire.name },
                  {
                    label: "E-mail",
                    value: stagiaire.email ? (
                      <a
                        href={`mailto:${stagiaire.email}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {stagiaire.email}
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Téléphone",
                    value: stagiaire.phone ? (
                      <a
                        href={`tel:${stagiaire.phone}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {stagiaire.phone}
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Ville",
                    value: first?.student_city || "—",
                  },
                  {
                    label: "École / organisme",
                    value: first?.student_company || first?.ski_school_name || "—",
                  },
                  ...(first?.course_location
                    ? [
                        {
                          label: "Lieu de formation",
                          value: (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                              {first.course_location}
                            </span>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </SurfaceCard>

            <SurfaceCard
              title={`Missions (${missions.length})`}
              description="Ouvre une mission pour le détail logistique"
            >
              <ul className="space-y-2">
                {missions.map((row) => (
                  <li key={row.id}>
                    <Link
                      to={`${basePath}/missions/${row.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] px-1 py-1.5 text-xs transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                    >
                      <span className="text-muted-foreground">
                        {row.code ? `${row.code} · ` : ""}
                        {inscriptionDateRangeLabel(row)}
                        {row.language
                          ? ` · ${displayLanguageLabel(row.language)}`
                          : ""}
                      </span>
                      <StatusPill tone={toneForStatus(row.status)} size="sm">
                        {getStatusLabel(row.status || "", "fr")}
                      </StatusPill>
                    </Link>
                  </li>
                ))}
              </ul>
            </SurfaceCard>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold">
                Contexte pédagogique
              </h2>
              {missions.map((row) => (
                <MissionPedagogieBlock
                  key={row.id}
                  row={row}
                  basePath={basePath}
                />
              ))}
            </div>
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
