import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  Loader2,
  Mail,
  RefreshCw,
  School,
  Users,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PageHeader,
  PageShell,
  SectionHeading,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";
import { useStageFillCampaign } from "@/hooks/useStageFillCampaign";
import { StageRelanceDialog } from "@/components/commercial/StageRelanceDialog";
import {
  directorStationKey,
  groupRowsForDirectorOutreach,
  isDirectorOutreachExcluded,
  type RelanceAudience,
  type StageFillRow,
} from "@/lib/commercial-stage-fill";
import { useUserPermissions } from "@/hooks/useUserPermissions";

/**
 * Commercial — stages sous le minimum d'inscrits.
 * Relances directeurs (par station) + anciens stagiaires (hors gel moniteurs).
 */
export default function StageFillPage() {
  const { canEdit } = useUserPermissions();
  const editable = canEdit("commercial");
  const { rows, underMin, isLoading, error, directorsFor, alumniFor, refetch } =
    useStageFillCampaign();

  const [onlyUnderMin, setOnlyUnderMin] = useState(true);
  const [sendingUnlocked, setSendingUnlocked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeRows, setActiveRows] = useState<StageFillRow[]>([]);
  const [audience, setAudience] = useState<RelanceAudience>("directeur");
  const [stationLabel, setStationLabel] = useState<string | undefined>();

  const visible = useMemo(
    () => (onlyUnderMin ? underMin : rows),
    [onlyUnderMin, underMin, rows]
  );

  const directorGroups = useMemo(
    () => groupRowsForDirectorOutreach(underMin),
    [underMin]
  );

  const openAlumni = (row: StageFillRow) => {
    setActiveRows([row]);
    setAudience("ancien");
    setStationLabel(undefined);
    setDialogOpen(true);
  };

  const openDirectorsForStation = (stationKey: string) => {
    const group = directorGroups.find((g) => g.stationKey === stationKey);
    if (!group || group.rows.length === 0) return;
    setActiveRows(group.rows);
    setAudience("directeur");
    setStationLabel(group.stationLabel);
    setDialogOpen(true);
  };

  const directors = useMemo(() => {
    if (audience !== "directeur" || activeRows.length === 0) return [];
    // Réutilise la même source que directorsFor via les offerings du groupe.
    // Le hook expose directorsFor(one) — on agrège ici via select côté page
    // en passant par directorsFor de chaque offering puis dédup e-mail.
    const seen = new Set<string>();
    const out = [];
    for (const row of activeRows) {
      for (const d of directorsFor(row.offering)) {
        const key = d.email.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(d);
      }
    }
    // Filtre Méribel déjà dans selectDirectorsForOfferings ; double sécurité.
    return out.filter(
      (d) =>
        !d.nom_affiche.toLowerCase().includes("méribel") &&
        !d.nom_affiche.toLowerCase().includes("meribel") &&
        !(d.station ?? "").toLowerCase().includes("méribel") &&
        !(d.station ?? "").toLowerCase().includes("meribel")
    );
  }, [audience, activeRows, directorsFor]);

  const alumni =
    audience === "ancien" && activeRows[0]
      ? alumniFor(activeRows[0].offering)
      : [];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Stages à compléter"
          description="Effectifs par session — relances directeurs par station (hors Méribel / Samoëns portugais) et anciens stagiaires."
          icon={Users}
          tone="gold"
          meta={
            <StatusPill tone={underMin.length > 0 ? "warning" : "success"}>
              {underMin.length} sous le minimum
            </StatusPill>
          }
          actions={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          }
        />

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Règle d'envoi</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Directeurs : un mail par station (ex. Oz — anglais + néerlandais).{" "}
              <strong>Méribel</strong> exclu (liste à recevoir) ·{" "}
              <strong>Samoëns portugais</strong> exclu. Anciens : invitation +
              bouche-à-oreille. Pas de prospection <code>ski_monitors</code>.
            </p>
            <p>
              Lien :{" "}
              <a
                className="underline"
                href="https://www.fli.fr/register"
                target="_blank"
                rel="noreferrer"
              >
                www.fli.fr/register
              </a>
              {" · "}
              <Link className="underline" to="/gestion/commercial">
                Prospects commerciaux
              </Link>
              .
            </p>
          </AlertDescription>
        </Alert>

        <StatTileGrid cols={4}>
          <StatTile
            label="Sessions catalogue"
            value={rows.length}
            hint="hors individuel en ligne"
            icon={School}
            tone="blue"
            loading={isLoading}
          />
          <StatTile
            label="Sous le minimum"
            value={underMin.length}
            hint="min 6 présentiel / 4 visio"
            icon={AlertTriangle}
            tone={underMin.length > 0 ? "rose" : "neutral"}
            loading={isLoading}
          />
          <StatTile
            label="Stations à relancer"
            value={directorGroups.length}
            hint="hors Méribel / Samoëns PT"
            icon={Mail}
            tone="gold"
            loading={isLoading}
          />
          <StatTile
            label="Places manquantes"
            value={underMin.reduce((sum, r) => sum + r.missing, 0)}
            hint="somme des écarts au min"
            icon={Users}
            tone="purple"
            loading={isLoading}
          />
        </StatTileGrid>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="only-under"
              checked={onlyUnderMin}
              onCheckedChange={setOnlyUnderMin}
            />
            <Label htmlFor="only-under">Uniquement sous le minimum</Label>
          </div>
          {editable && (
            <div className="flex items-center gap-2">
              <Switch
                id="unlock-send"
                checked={sendingUnlocked}
                onCheckedChange={setSendingUnlocked}
              />
              <Label htmlFor="unlock-send">
                Débloquer l'envoi (après OK Paula sur les textes)
              </Label>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Chargement impossible</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calcul des effectifs…
          </div>
        ) : (
          <>
            <SectionHeading
              title="Relances directeurs (par station)"
              description="Un e-mail regroupe toutes les langues de la station."
            />
            {directorGroups.length === 0 ? (
              <TableEmpty
                title="Aucune station à relancer"
                description="Soit tous les stages sont au minimum, soit seuls Méribel / Samoëns portugais restent sous le min."
              />
            ) : (
              <div className="grid gap-3">
                {directorGroups.map((group) => {
                  const langs = group.rows
                    .map((r) => r.offering.language_label)
                    .join(" · ");
                  const realDirCount = (() => {
                    const seen = new Set<string>();
                    for (const row of group.rows) {
                      for (const d of directorsFor(row.offering)) {
                        seen.add(d.email.toLowerCase());
                      }
                    }
                    return seen.size;
                  })();
                  return (
                    <SurfaceCard key={group.stationKey} className="p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone="warning">{group.stationLabel}</StatusPill>
                            <span className="font-medium">{langs}</span>
                          </div>
                          <ul className="text-sm text-muted-foreground">
                            {group.rows.map((r) => (
                              <li key={r.offering.id}>
                                {r.offering.session_code} · {r.offering.language_label}{" "}
                                — {r.enrolledCount}/{r.minRequired}
                                {r.offering.date_label
                                  ? ` · ${r.offering.date_label}`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-muted-foreground">
                            {realDirCount} directeur{realDirCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!editable || realDirCount === 0}
                          onClick={() => openDirectorsForStation(group.stationKey)}
                        >
                          <School className="mr-2 h-4 w-4" />
                          Directeurs
                        </Button>
                      </div>
                    </SurfaceCard>
                  );
                })}
              </div>
            )}

            <SectionHeading
              title="Stages (anciens stagiaires)"
              description="Invitation à recommencer + bouche-à-oreille — y compris Méribel / Samoëns PT."
            />
            {visible.length === 0 ? (
              <TableEmpty
                title={onlyUnderMin ? "Tous les stages sont au minimum" : "Aucune session"}
                description={
                  onlyUnderMin
                    ? "Passez le filtre pour voir l'ensemble du catalogue saison."
                    : "Vérifiez le catalogue registration_offerings."
                }
              />
            ) : (
              <div className="grid gap-3">
                {visible.map((row) => {
                  const alumCount = alumniFor(row.offering).length;
                  const excluded = isDirectorOutreachExcluded(row.offering);
                  const stationKey = directorStationKey(row.offering);
                  return (
                    <SurfaceCard key={row.offering.id} className="p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={row.underMin ? "danger" : "success"}>
                              {row.offering.session_code ?? "—"}
                            </StatusPill>
                            <span className="font-medium">
                              {row.offering.location_label} ·{" "}
                              {row.offering.language_label}
                            </span>
                            {excluded && (
                              <StatusPill tone="neutral">
                                hors mail directeurs
                              </StatusPill>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {row.offering.date_label ??
                              `${row.offering.start_date} → ${row.offering.end_date}`}
                          </p>
                          <p className="text-sm">
                            <strong>
                              {row.enrolledCount}/{row.minRequired}
                            </strong>{" "}
                            inscrit·es
                            {row.underMin ? (
                              <span className="text-rose-700">
                                {" "}
                                — il manque {row.missing}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Anciens : {alumCount}
                            {!excluded
                              ? ` · station « ${stationKey} » pour directeurs`
                              : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!editable || alumCount === 0}
                          onClick={() => openAlumni(row)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Anciens
                        </Button>
                      </div>
                    </SurfaceCard>
                  );
                })}
              </div>
            )}
          </>
        )}
      </PageShell>

      <StageRelanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rows={activeRows}
        audience={audience}
        directors={directors}
        alumni={alumni}
        stationLabel={stationLabel}
        sendingUnlocked={sendingUnlocked}
      />
    </MainLayout>
  );
}
