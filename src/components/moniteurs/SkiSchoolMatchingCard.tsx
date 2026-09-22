import { Button } from "@/components/ui/button";
import {
  CardList,
  CardListItem,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
} from "@/components/ui-kit";
import { Loader2, Link2, Building2, Wand2 } from "lucide-react";
import { useSkiSchoolPartnerMatching } from "@/hooks/useSkiSchoolPartnerMatching";
import { toast } from "sonner";
import {
  MESSAGE_GEL_PROSPECTION,
  PROSPECTION_MONITEURS_GELEE,
} from "@/lib/prospection-gel";

const KIND_LABELS: Record<string, string> = {
  esf: "ESF",
  ecole_ski: "École de ski",
  autre: "Autre",
};

export function SkiSchoolMatchingCard() {
  const { previews, unmatched, linked, runAutoMatching, linkSchool, createAndLink, schoolsQuery } =
    useSkiSchoolPartnerMatching();

  const handleAuto = async () => {
    try {
      const result = await runAutoMatching.mutateAsync();
      toast.success(
        `Matching terminé: ${result.linked} liées, ${result.created} partenaires créés, ${result.skipped} déjà liées`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de matching");
    }
  };

  if (schoolsQuery.isLoading) {
    return (
      <SurfaceCard
        title="Matching écoles de ski ↔ partenaires"
        icon={Building2}
        flush
      >
        <TableSkeleton rows={5} cols={5} />
      </SurfaceCard>
    );
  }

  /** Bouton d'action d'une ligne — identique en tableau et en carte mobile. */
  const rowAction = (preview: (typeof previews)[number]) =>
    preview.school.partner_id ? null : preview.best_match ? (
      <Button
        size="sm"
        variant="outline"
        disabled={linkSchool.isPending}
        onClick={async () => {
          try {
            await linkSchool.mutateAsync({
              schoolId: preview.school.id,
              partnerId: preview.best_match!.partner.id,
              schoolKind: preview.school_kind,
              station: preview.station,
            });
            toast.success(`${preview.school.name} liée`);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          }
        }}
      >
        <Link2 className="mr-1 h-3 w-3" />
        Lier
      </Button>
    ) : (
      <Button
        size="sm"
        disabled={createAndLink.isPending || PROSPECTION_MONITEURS_GELEE}
        title={PROSPECTION_MONITEURS_GELEE ? MESSAGE_GEL_PROSPECTION : undefined}
        onClick={async () => {
          try {
            await createAndLink.mutateAsync(preview);
            toast.success(`Partenaire créé pour ${preview.school.name}`);
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          }
        }}
      >
        Créer
      </Button>
    );

  /** Suggestion de rapprochement — même texte en tableau et en carte. */
  const suggestion = (preview: (typeof previews)[number]) =>
    preview.school.partner_id ? (
      <StatusPill tone="success" size="sm">Déjà liée</StatusPill>
    ) : preview.best_match ? (
      <div className="min-w-0 text-sm">
        <div className="truncate">{preview.best_match.partner.name}</div>
        <div className="text-muted-foreground">
          score {preview.best_match.score} — {preview.best_match.reason}
        </div>
      </div>
    ) : (
      <span className="text-sm text-muted-foreground">Aucune suggestion — créer partenaire</span>
    );

  return (
    <SurfaceCard
      title="Matching écoles de ski ↔ partenaires"
      description={
        <>
          ESF et autres écoles — lie chaque <code>ski_school</code> à un partenaire organisationnel
          pour les dates de stage et l&apos;outreach.
        </>
      }
      icon={Building2}
      actions={
        <Button
          onClick={handleAuto}
          disabled={
            runAutoMatching.isPending ||
            unmatched.length === 0 ||
            PROSPECTION_MONITEURS_GELEE
          }
          title={PROSPECTION_MONITEURS_GELEE ? MESSAGE_GEL_PROSPECTION : undefined}
        >
          {runAutoMatching.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Matcher automatiquement
        </Button>
      }
      toolbar={
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="success">{linked.length} liées</StatusPill>
          <StatusPill tone="warning">{unmatched.length} à traiter</StatusPill>
          <StatusPill tone="neutral">
            {previews.filter((p) => p.school_kind === "esf").length} ESF
          </StatusPill>
          <StatusPill tone="neutral">
            {previews.filter((p) => p.school_kind !== "esf").length} non-ESF
          </StatusPill>
        </div>
      }
      flush
    >
      {previews.length === 0 ? (
        <TableEmpty
          title="Aucune école de ski"
          description="Aucune école à rapprocher d'un partenaire pour le moment."
          icon={Building2}
        />
      ) : (
        <>
          <TableFrame>
            <table className="hidden w-full md:table">
              <thead>
                <TableHeadRow>
                  <TableHeadCell>École</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                  <TableHeadCell>Station</TableHeadCell>
                  <TableHeadCell>Suggestion</TableHeadCell>
                  <TableHeadCell align="right">Action</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {previews.map((preview) => (
                  <TableRow key={preview.school.id}>
                    <TableCell className="font-medium">{preview.school.name}</TableCell>
                    <TableCell>
                      <StatusPill tone="neutral" size="sm">
                        {KIND_LABELS[preview.school_kind] || preview.school_kind}
                      </StatusPill>
                    </TableCell>
                    <TableCell>{preview.station || "—"}</TableCell>
                    <TableCell>{suggestion(preview)}</TableCell>
                    <TableCell align="right">{rowAction(preview)}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </TableFrame>

          <CardList className="md:hidden">
            {previews.map((preview) => (
              <CardListItem
                key={preview.school.id}
                title={preview.school.name}
                subtitle={preview.station || "—"}
                meta={
                  <StatusPill tone="neutral" size="sm">
                    {KIND_LABELS[preview.school_kind] || preview.school_kind}
                  </StatusPill>
                }
                fields={[
                  {
                    label: "Suggestion",
                    value: preview.school.partner_id
                      ? "Déjà liée"
                      : preview.best_match
                        ? `${preview.best_match.partner.name} · score ${preview.best_match.score}`
                        : "Aucune suggestion — créer partenaire",
                  },
                ]}
                actions={rowAction(preview)}
              />
            ))}
          </CardList>
        </>
      )}
    </SurfaceCard>
  );
}
