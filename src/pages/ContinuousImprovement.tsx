import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, TrendingUp } from "lucide-react";
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

const statusColors: Record<ImprovementStatus, string> = {
  'EN_COURS': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'TERMINE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'ABANDONNE': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const typeColors: Record<ImprovementType, string> = {
  'VEILLE_PEDAGOGIQUE': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'VEILLE_REGLEMENTAIRE': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'VEILLE_FINANCIERE': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'AMELIORATION': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'RECLAMATION': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Amélioration Continue</h1>
            <p className="text-muted-foreground">Suivi Qualiopi des actions d'amélioration et de veille</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total actions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.enCours}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.termine}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Thème</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Date début</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredImprovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune action trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredImprovements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge className={typeColors[item.type]} variant="secondary">
                          {typeLabels[item.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.theme || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.source || '-'}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{item.action}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status]} variant="secondary">
                          {statusLabels[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(item.start_date), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {editable && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
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
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        {editable && (
          <Button
            onClick={handleCreate}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

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
      </div>
    </MainLayout>
  );
}
