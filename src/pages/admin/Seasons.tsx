import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Star, Trash2 } from "lucide-react";
import { useSeasons, useActivateSeason, useDeleteSeason, type Season } from "@/hooks/useSeasons";
import { SeasonFormDialog } from "@/components/admin/SeasonFormDialog";
import { PricingRulesTable } from "@/components/admin/PricingRulesTable";
import { toast } from "sonner";
import { format } from "date-fns";
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

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "default" as const;
    case "terminee": return "secondary" as const;
    default: return "outline" as const;
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">{t(translations.subtitle)}</p>
          </div>
          <Button onClick={() => { setEditSeason(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t(translations.newSeason)}
          </Button>
        </div>

        {/* Season Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {seasons?.map((season) => (
            <Card
              key={season.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSeason?.id === season.id ? "ring-2 ring-primary" : ""
              } ${season.is_current ? "border-[hsl(var(--fli-yellow))] border-2" : ""}`}
              onClick={() => setSelectedSeason(season)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {season.is_current && <Star className="h-4 w-4 text-[hsl(var(--fli-yellow))] fill-current" />}
                    <h3 className="font-semibold">{season.name}</h3>
                  </div>
                  <Badge variant={statusVariant(season.status)}>
                    {t(translations[season.status as keyof typeof translations] || { fr: season.status, "pt-BR": season.status, en: season.status })}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(season.start_date), "dd/MM/yyyy")} — {format(new Date(season.end_date), "dd/MM/yyyy")}
                </div>
                {season.revenue_target ? (
                  <p className="text-sm text-muted-foreground">
                    {t(translations.target)} : {formatPrice(Number(season.revenue_target))}
                  </p>
                ) : null}
                <div className="flex gap-2 pt-1">
                  {!season.is_current && season.status !== "terminee" && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActivateId(season.id); }}>
                      {t(translations.activate)}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditSeason(season); setFormOpen(true); }}>
                    Modifier
                  </Button>
                  {!season.is_current && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(season.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!isLoading && (!seasons || seasons.length === 0) && (
            <p className="col-span-full text-center text-muted-foreground py-12">{t(translations.noSeasons)}</p>
          )}
        </div>

        {/* Pricing Rules for selected season */}
        {selectedSeason && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {t(translations.pricingRules)} — {selectedSeason.name}
            </h2>
            <PricingRulesTable seasonId={selectedSeason.id} />
          </div>
        )}
      </div>

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
            <AlertDialogTitle>{t(translations.confirmDelete)}</AlertDialogTitle>
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
