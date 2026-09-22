import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingUp,
  CheckCircle2,
  Clock,
  CalendarPlus,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useContinuousImprovement, ContinuousImprovement, ImprovementType, ImprovementStatus, ContinuousImprovementFormData } from "@/hooks/useContinuousImprovement";
import { ImprovementFormDialog } from "@/components/improvement/ImprovementFormDialog";
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
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  CardList,
  CardListItem,
  FilterBar,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
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
import type { PillTone } from "@/components/ui-kit";

const typeLabels: Record<ImprovementType, string> = {
  'VEILLE_PEDAGOGIQUE': 'Veille pédagogique',
  'VEILLE_REGLEMENTAIRE': 'Veille réglementaire',
  'VEILLE_FINANCIERE': 'Veille financière',
  'AMELIORATION': 'Amélioration',
  'RECLAMATION': 'Réclamation',
};

const statusLabels: Record<ImprovementStatus, string> = {
  'EN_COURS': 'En cours',
  'TERMINE': 'Terminé',
  'ABANDONNE': 'Abandonné',
};

/** Teintes d'état — jetons du kit, jamais de couleur en dur. */
const statusTones: Record<ImprovementStatus, PillTone> = {
  'EN_COURS': 'info',
  'TERMINE': 'success',
  'ABANDONNE': 'neutral',
};

/** Teintes de type — mêmes familles que les couleurs historiques. */
const typeTones: Record<ImprovementType, PillTone> = {
  'VEILLE_PEDAGOGIQUE': 'purple',
  'VEILLE_REGLEMENTAIRE': 'accent',
  'VEILLE_FINANCIERE': 'success',
  'AMELIORATION': 'info',
  'RECLAMATION': 'danger',
};

export default function ContinuousImprovementPage() {
  const { improvements, isLoading, createImprovement, updateImprovement, deleteImprovement } = useContinuousImprovement();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("amelioration");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContinuousImprovement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContinuousImprovement | null>(null);

  const filteredImprovements = useMemo(() => {
    if (!improvements) return [];

    return improvements.filter((item) => {
      const matchesSearch =
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.problem?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [improvements, searchTerm, typeFilter, statusFilter]);

  const handleCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: ContinuousImprovement) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (item: ContinuousImprovement) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteImprovement.mutate(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSubmit = (data: ContinuousImprovementFormData) => {
    if (editingItem) {
      updateImprovement.mutate({ ...data, id: editingItem.id }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createImprovement.mutate(data, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  // Stats
  const stats = useMemo(() => {
    if (!improvements) return { total: 0, enCours: 0, termine: 0, thisMonth: 0 };

    const now = new Date();
    const thisMonth = improvements.filter(i => {
      const date = new Date(i.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    return {
      total: improvements.length,
      enCours: improvements.filter(i => i.status === 'EN_COURS').length,
      termine: improvements.filter(i => i.status === 'TERMINE').length,
      thisMonth: thisMonth.length,
    };
  }, [improvements]);

  /** Filtres actifs rappelés en chips effaçables. */
  const activeFilters = [
    ...(typeFilter !== "all"
      ? [{
          key: "type",
          label: typeLabels[typeFilter as ImprovementType] ?? typeFilter,
          onRemove: () => setTypeFilter("all"),
        }]
      : []),
    ...(statusFilter !== "all"
      ? [{
          key: "status",
          label: statusLabels[statusFilter as ImprovementStatus] ?? statusFilter,
          onRemove: () => setStatusFilter("all"),
        }]
      : []),
    ...(searchTerm
      ? [{ key: "search", label: `« ${searchTerm} »`, onRemove: () => setSearchTerm("") }]
      : []),
  ];

  const clearAll = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  };

  const renderRowActions = (item: ContinuousImprovement) =>
    editable ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Actions sur cette ligne">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(item)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDelete(item)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Amélioration Continue"
          description="Suivi Qualiopi des actions d'amélioration et de veille"
          icon={TrendingUp}
          tone="teal"
          actions={
            editable && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle action
              </Button>
            )
          }
        />

        {/* KPI — chaque compteur filtre la liste ci-dessous. */}
        <StatTileGrid cols={4}>
          <StatTile
            label="Total actions"
            value={stats.total}
            icon={TrendingUp}
            tone="gold"
            loading={isLoading}
            onClick={clearAll}
          />
          <StatTile
            label="En cours"
            value={stats.enCours}
            icon={Clock}
            tone="blue"
            loading={isLoading}
            onClick={() => setStatusFilter("EN_COURS")}
          />
          <StatTile
            label="Terminées"
            value={stats.termine}
            icon={CheckCircle2}
            tone="teal"
            loading={isLoading}
            onClick={() => setStatusFilter("TERMINE")}
          />
          <StatTile
            label="Ce mois"
            value={stats.thisMonth}
            icon={CalendarPlus}
            tone="purple"
            loading={isLoading}
          />
        </StatTileGrid>

        <SurfaceCard
          title="Registre des actions"
          description={`${filteredImprovements.length} action${filteredImprovements.length > 1 ? "s" : ""} affichée${filteredImprovements.length > 1 ? "s" : ""}`}
          toolbar={
            <FilterBar
              search={{
                value: searchTerm,
                onChange: setSearchTerm,
                placeholder: "Rechercher...",
                ariaLabel: "Rechercher une action d'amélioration",
              }}
              filters={
                <>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]" aria-label="Type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" aria-label="Statut">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              }
              activeFilters={activeFilters}
              onClearAll={activeFilters.length > 0 ? clearAll : undefined}
            />
          }
          flush
        >
          {isLoading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : filteredImprovements.length === 0 ? (
            <TableEmpty
              icon={ClipboardList}
              title="Aucune action trouvée"
              description="Aucune action d'amélioration ne correspond aux filtres en cours."
              action={
                editable ? (
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle action
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <TableFrame className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Type</TableHeadCell>
                      <TableHeadCell>Thème</TableHeadCell>
                      <TableHeadCell className="hidden md:table-cell">Source</TableHeadCell>
                      <TableHeadCell>Action</TableHeadCell>
                      <TableHeadCell>Statut</TableHeadCell>
                      <TableHeadCell className="hidden lg:table-cell">Date début</TableHeadCell>
                      <TableHeadCell className="w-[56px]">
                        <span className="sr-only">Actions</span>
                      </TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {filteredImprovements.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <StatusPill tone={typeTones[item.type]} size="sm">
                            {typeLabels[item.type]}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="font-medium">{item.theme || '-'}</TableCell>
                        <TableCell hideBelow="md">{item.source || '-'}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{item.action}</TableCell>
                        <TableCell>
                          <StatusPill tone={statusTones[item.status]} size="sm">
                            {statusLabels[item.status]}
                          </StatusPill>
                        </TableCell>
                        <TableCell hideBelow="lg" className="tabular">
                          {format(new Date(item.start_date), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell align="right">{renderRowActions(item)}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </TableFrame>

              {/* Doublure mobile : un tableau à 7 colonnes ne se lit pas sur un téléphone. */}
              <CardList className="md:hidden">
                {filteredImprovements.map((item) => (
                  <CardListItem
                    key={item.id}
                    title={item.theme || item.action}
                    subtitle={item.action}
                    meta={
                      <StatusPill tone={statusTones[item.status]} size="sm">
                        {statusLabels[item.status]}
                      </StatusPill>
                    }
                    fields={[
                      { label: "Type", value: typeLabels[item.type] },
                      { label: "Source", value: item.source || "-" },
                      {
                        label: "Date début",
                        value: format(new Date(item.start_date), 'dd MMM yyyy', { locale: fr }),
                      },
                    ]}
                    actions={renderRowActions(item)}
                  />
                ))}
              </CardList>
            </>
          )}
        </SurfaceCard>

        {/* Form Dialog */}
        <ImprovementFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          improvement={editingItem}
          onSubmit={handleSubmit}
          isLoading={createImprovement.isPending || updateImprovement.isPending}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette action d'amélioration ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageShell>
    </MainLayout>
  );
}
