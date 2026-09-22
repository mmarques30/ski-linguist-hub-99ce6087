import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, Star, Trash2, CalendarRange, Target, Tags } from "lucide-react";
import { useSeasons, useActivateSeason, useDeleteSeason, type Season } from "@/hooks/useSeasons";
import { SeasonFormDialog } from "@/components/admin/SeasonFormDialog";
import { PricingRulesTable } from "@/components/admin/PricingRulesTable";
import {
  CardGrid,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  type PillTone,
} from "@/components/ui-kit";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const translations = {
  title: { fr: "Gestion des saisons", "pt-BR": "Gestão de temporadas", en: "Season Management" },
  subtitle: { fr: "Configurez les saisons et les grilles tarifaires", "pt-BR": "Configure as temporadas e tabelas de preços", en: "Configure seasons and pricing grids" },
  newSeason: { fr: "Nouvelle saison", "pt-BR": "Nova temporada", en: "New Season" },
  activate: { fr: "Activer", "pt-BR": "Ativar", en: "Activate" },
  current: { fr: "Saison active", "pt-BR": "Temporada ativa", en: "Active Season" },
  planifiee: { fr: "Planifiée", "pt-BR": "Planejada", en: "Planned" },
  active: { fr: "Active", "pt-BR": "Ativa", en: "Active" },
  terminee: { fr: "Terminée", "pt-BR": "Encerrada", en: "Ended" },
  target: { fr: "Objectif CA", "pt-BR": "Meta de receita", en: "Revenue Target" },
  confirmActivate: { fr: "Activer cette saison ?", "pt-BR": "Ativar esta temporada?", en: "Activate this season?" },
  confirmActivateDesc: { fr: "La saison actuelle sera automatiquement terminée.", "pt-BR": "A temporada atual será automaticamente encerrada.", en: "The current season will be automatically ended." },
  activated: { fr: "Saison activée", "pt-BR": "Temporada ativada", en: "Season activated" },
  deleted: { fr: "Saison supprimée", "pt-BR": "Temporada excluída", en: "Season deleted" },
  confirmDelete: { fr: "Supprimer cette saison ?", "pt-BR": "Excluir esta temporada?", en: "Delete this season?" },
  confirmDeleteDesc: { fr: "Cette action est irréversible. Les règles tarifaires associées seront aussi supprimées.", "pt-BR": "Esta ação é irreversível. As regras de preços associadas também serão excluídas.", en: "This action is irreversible. Associated pricing rules will also be deleted." },
  cancel: { fr: "Annuler", "pt-BR": "Cancelar", en: "Cancel" },
  confirm: { fr: "Confirmer", "pt-BR": "Confirmar", en: "Confirm" },
  pricingRules: { fr: "Grille tarifaire", "pt-BR": "Tabela de preços", en: "Pricing Grid" },
  noSeasons: { fr: "Aucune saison configurée", "pt-BR": "Nenhuma temporada configurada", en: "No seasons configured" },
};

/** Teinte de la pastille d'état — le libellé reste porté par `translations`. */
const statusTone = (status: string): PillTone => {
  switch (status) {
    case "active": return "success";
    case "terminee": return "neutral";
    default: return "info";
  }
};

export default function Seasons() {
  const { t } = useLanguage();
  const { data: seasons, isLoading } = useSeasons();
  const activateMutation = useActivateSeason();
  const deleteMutation = useDeleteSeason();
  const [formOpen, setFormOpen] = useState(false);
  const [editSeason, setEditSeason] = useState<Season | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatPrice = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(v);

  const handleActivate = async () => {
    if (!activateId) return;
    try {
      await activateMutation.mutateAsync(activateId);
      toast.success(t(translations.activated));
    } catch (e: any) {
      toast.error(e.message);
    }
    setActivateId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      if (selectedSeason?.id === deleteId) setSelectedSeason(null);
      toast.success(t(translations.deleted));
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleteId(null);
  };

  const currentSeason = seasons?.find((s) => s.is_current);

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={CalendarRange}
          tone="gold"
          meta={
            currentSeason ? (
              <StatusPill tone="success" icon={Star}>
                {t(translations.current)} : {currentSeason.name}
              </StatusPill>
            ) : undefined
          }
          actions={
            <Button onClick={() => { setEditSeason(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t(translations.newSeason)}
            </Button>
          }
        />

        {/* Cartes de saison — une carte par saison, sélection = grille tarifaire en dessous. */}
        {isLoading ? (
          <CardGrid cols={3}>
            {[0, 1, 2].map((index) => (
              <div key={index} className="fli-surface space-y-3 p-4 sm:p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </CardGrid>
        ) : !seasons || seasons.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty
              title={t(translations.noSeasons)}
              icon={CalendarRange}
              action={
                <Button onClick={() => { setEditSeason(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t(translations.newSeason)}
                </Button>
              }
            />
          </SurfaceCard>
        ) : (
          <CardGrid cols={3}>
            {seasons.map((season) => {
              const selected = selectedSeason?.id === season.id;
              return (
                <div
                  key={season.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`Voir la grille tarifaire de ${season.name}`}
                  onClick={() => setSelectedSeason(season)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedSeason(season);
                    }
                  }}
                  className="rounded-[var(--radius-card)] focus-visible:outline-none"
                >
                <SurfaceCard
                  interactive
                  accent={season.is_current ? "primary" : "none"}
                  className={cn(
                    "h-full cursor-pointer",
                    selected && "ring-2 ring-primary ring-offset-2 ring-offset-[hsl(var(--surface-page))]"
                  )}
                  bodyClassName="space-y-3"
                  title={
                    <span className="flex min-w-0 items-center gap-2">
                      {season.is_current && (
                        <Star className="h-4 w-4 shrink-0 fill-current text-primary" aria-hidden />
                      )}
                      <span className="truncate">{season.name}</span>
                    </span>
                  }
                  actions={
                    <StatusPill tone={statusTone(season.status)}>
                      {t(
                        translations[season.status as keyof typeof translations] || {
                          fr: season.status,
                          "pt-BR": season.status,
                          en: season.status,
                        }
                      )}
                    </StatusPill>
                  }
                >
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="tabular">
                        {format(new Date(season.start_date), "dd/MM/yyyy")} — {format(new Date(season.end_date), "dd/MM/yyyy")}
                      </span>
                    </span>
                    {season.revenue_target ? (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span>
                          {t(translations.target)} :{" "}
                          <span className="font-medium tabular text-foreground">
                            {formatPrice(Number(season.revenue_target))}
                          </span>
                        </span>
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {!season.is_current && season.status !== "terminee" && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActivateId(season.id); }}>
                        {t(translations.activate)}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditSeason(season); setFormOpen(true); }}>
                      Modifier
                    </Button>
                    {!season.is_current && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`${t(translations.confirmDelete)} ${season.name}`}
                        onClick={(e) => { e.stopPropagation(); setDeleteId(season.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </SurfaceCard>
                </div>
              );
            })}
          </CardGrid>
        )}

        {/* Grille tarifaire de la saison sélectionnée */}
        {selectedSeason && (
          <SurfaceCard
            title={`${t(translations.pricingRules)} — ${selectedSeason.name}`}
            icon={Tags}
            description={`${format(new Date(selectedSeason.start_date), "dd/MM/yyyy")} — ${format(new Date(selectedSeason.end_date), "dd/MM/yyyy")}`}
          >
            <PricingRulesTable seasonId={selectedSeason.id} />
          </SurfaceCard>
        )}
      </PageShell>

      <SeasonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        season={editSeason}
      />

      {/* Activate confirmation */}
      <AlertDialog open={!!activateId} onOpenChange={() => setActivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(translations.confirmActivate)}</AlertDialogTitle>
            <AlertDialogDescription>{t(translations.confirmActivateDesc)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>{t(translations.confirm)}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
              {t(translations.confirmDelete)}
            </AlertDialogTitle>
            <AlertDialogDescription>{t(translations.confirmDeleteDesc)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t(translations.confirm)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
