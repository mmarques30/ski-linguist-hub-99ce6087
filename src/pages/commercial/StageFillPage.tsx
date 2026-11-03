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
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";
import { useStageFillCampaign } from "@/hooks/useStageFillCampaign";
import { StageRelanceDialog } from "@/components/commercial/StageRelanceDialog";
import type { RelanceAudience, StageFillRow } from "@/lib/commercial-stage-fill";
import { useUserPermissions } from "@/hooks/useUserPermissions";

/**
 * Commercial — stages sous le minimum d'inscrits.
 * Relances directeurs + anciens stagiaires (hors gel moniteurs).
 */
export default function StageFillPage() {
  const { canEdit } = useUserPermissions();
  const editable = canEdit("commercial");
  const { rows, underMin, isLoading, error, directorsFor, alumniFor, refetch } =
    useStageFillCampaign();

  const [onlyUnderMin, setOnlyUnderMin] = useState(true);
  const [sendingUnlocked, setSendingUnlocked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<StageFillRow | null>(null);
  const [audience, setAudience] = useState<RelanceAudience>("directeur");

  const visible = useMemo(
    () => (onlyUnderMin ? underMin : rows),
    [onlyUnderMin, underMin, rows]
  );

  const openRelance = (row: StageFillRow, nextAudience: RelanceAudience) => {
    setActiveRow(row);
    setAudience(nextAudience);
    setDialogOpen(true);
  };

  const directors = activeRow ? directorsFor(activeRow.offering) : [];
  const alumni = activeRow ? alumniFor(activeRow.offering) : [];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Stages à compléter"
          description="Effectifs par session catalogue — relancer les directeurs et les anciens stagiaires (pas la base moniteurs gelée)."
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
              Aucun e-mail ne part sans validation explicite des brouillons (Paula). La
              prospection <code>ski_monitors</code> reste gelée — ici uniquement
              <strong> directeurs</strong> (<code>ski_school_directory</code>) et{" "}
              <strong>anciens stagiaires</strong> (dossiers terminés / facturés).
            </p>
            <p>
              Lien d'inscription :{" "}
              <a
                className="underline"
                href="https://www.fli.fr/register"
                target="_blank"
                rel="noreferrer"
              >
                www.fli.fr/register
              </a>
              . Pipeline leads :{" "}
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
            label="Places manquantes"
            value={underMin.reduce((sum, r) => sum + r.missing, 0)}
            hint="somme des écarts au min"
            icon={Users}
            tone="gold"
            loading={isLoading}
          />
          <StatTile
            label="Prochaine échéance"
            value={
              underMin[0]?.offering.date_label?.split(" ")[0] ??
              underMin[0]?.offering.start_date?.slice(5) ??
              "—"
            }
            hint={underMin[0]?.offering.location_label ?? "aucun stage critique"}
            icon={Mail}
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
        ) : visible.length === 0 ? (
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
              const dirCount = directorsFor(row.offering).length;
              const alumCount = alumniFor(row.offering).length;
              return (
                <SurfaceCard key={row.offering.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={row.underMin ? "danger" : "success"}>
                          {row.offering.session_code ?? "—"}
                        </StatusPill>
                        <span className="font-medium">
                          {row.offering.location_label} · {row.offering.language_label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {row.offering.date_label ??
                          `${row.offering.start_date} → ${row.offering.end_date}`}
                        {row.offering.format_label
                          ? ` · ${row.offering.format_label}`
                          : ""}
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
                        ) : (
                          <span className="text-emerald-700"> — minimum atteint</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cibles : {dirCount} directeur{dirCount !== 1 ? "s" : ""} ·{" "}
                        {alumCount} ancien{alumCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!editable || dirCount === 0}
                        onClick={() => openRelance(row, "directeur")}
                      >
                        <School className="mr-2 h-4 w-4" />
                        Directeurs
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!editable || alumCount === 0}
                        onClick={() => openRelance(row, "ancien")}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Anciens
                      </Button>
                    </div>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        )}
      </PageShell>

      <StageRelanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        row={activeRow}
        audience={audience}
        directors={directors}
        alumni={alumni}
        sendingUnlocked={sendingUnlocked}
      />
    </MainLayout>
  );
}
