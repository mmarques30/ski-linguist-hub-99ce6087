import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Archive, 
  Trash2, 
  Upload,
  Download,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useTestPhrases,
  useCreateTestPhrase,
  useUpdateTestPhrase,
  useDeleteTestPhrase,
  useBulkImportPhrases,
  type TestPhrase,
} from "@/hooks/useTestPhrases";
import {
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  LANGUAGES,
  CATEGORIES,
  CATEGORY_LABELS,
  PROFESSIONS,
  PROFESSION_LABELS,
  LEVELS,
  generatePhraseCode,
} from "@/lib/evaluation-utils";

export default function AdminPhrases() {
  const { toast } = useToast();
  
  // Filters
  const [languageFilter, setLanguageFilter] = useState<string>("_all");
  const [categoryFilter, setCategoryFilter] = useState<string>("_all");
  const [professionFilter, setProfessionFilter] = useState<string>("_all");
  const [positiveFilter, setPositiveFilter] = useState<string>("_all");
  const [activeFilter, setActiveFilter] = useState<string>("true");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState<TestPhrase | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    language: "all",
    category: "introduction",
    profession: "",
    level_min: "",
    level_max: "",
    code: "",
    text_fr: "",
    is_positive: true,
    order_index: 0,
    active: true,
  });

  // Import state
  const [importJson, setImportJson] = useState("");
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // Queries and mutations
  const { data: phrases, isLoading, refetch } = useTestPhrases({
    language: languageFilter === "_all" ? undefined : languageFilter,
    category: categoryFilter === "_all" ? undefined : categoryFilter,
    profession: professionFilter === "_all" ? undefined : professionFilter,
    isPositive: positiveFilter === "_all" ? undefined : positiveFilter === "true",
    active: activeFilter === "_all" ? undefined : activeFilter === "true",
    search: searchQuery || undefined,
  });

  const createMutation = useCreateTestPhrase();
  const updateMutation = useUpdateTestPhrase();
  const deleteMutation = useDeleteTestPhrase();
  const importMutation = useBulkImportPhrases();

  const openCreateDialog = () => {
    setSelectedPhrase(null);
    setFormData({
      language: "all",
      category: "introduction",
      profession: "",
      level_min: "",
      level_max: "",
      code: "",
      text_fr: "",
      is_positive: true,
      order_index: (phrases?.length || 0) + 1,
      active: true,
    });
    setEditDialogOpen(true);
  };

  const openEditDialog = (phrase: TestPhrase) => {
    setSelectedPhrase(phrase);
    setFormData({
      language: phrase.language,
      category: phrase.category,
      profession: phrase.profession || "",
      level_min: phrase.level_min || "",
      level_max: phrase.level_max || "",
      code: phrase.code || "",
      text_fr: phrase.text_fr,
      is_positive: phrase.is_positive,
      order_index: phrase.order_index,
      active: phrase.active,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      ...formData,
      profession: formData.profession || null,
      level_min: formData.level_min || null,
      level_max: formData.level_max || null,
      code: formData.code || null,
    };

    if (selectedPhrase) {
      await updateMutation.mutateAsync({ id: selectedPhrase.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedPhrase) {
      await deleteMutation.mutateAsync(selectedPhrase.id);
      setDeleteDialogOpen(false);
      setSelectedPhrase(null);
    }
  };

  const handleToggleActive = async (phrase: TestPhrase) => {
    await updateMutation.mutateAsync({
      id: phrase.id,
      active: !phrase.active,
    });
  };

  const handleImportPreview = () => {
    try {
      const parsed = JSON.parse(importJson);
      const phrasesToImport = parsed.phrases || parsed;
      setImportPreview(Array.isArray(phrasesToImport) ? phrasesToImport : []);
    } catch {
      toast({
        variant: "destructive",
        title: "JSON invalide",
        description: "Veuillez vérifier le format du fichier.",
      });
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) return;
    
    await importMutation.mutateAsync(importPreview);
    setImportDialogOpen(false);
    setImportJson("");
    setImportPreview([]);
  };

  const handleExport = () => {
    if (!phrases) return;
    
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        count: phrases.length,
      },
      phrases: phrases.map(({ id, created_at, updated_at, ...rest }) => rest),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phrases-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Phrases</h1>
            <p className="text-muted-foreground">
              Gérez les phrases pré-rédigées pour les comptes-rendus d'évaluation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!phrases?.length}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle phrase
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="relative col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Toutes</SelectItem>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_FLAGS[lang]} {LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Toutes</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={professionFilter} onValueChange={setProfessionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Toutes</SelectItem>
                  {PROFESSIONS.map((prof) => (
                    <SelectItem key={prof} value={prof}>
                      {PROFESSION_LABELS[prof]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={positiveFilter} onValueChange={setPositiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tonalité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Toutes</SelectItem>
                  <SelectItem value="true">Positives</SelectItem>
                  <SelectItem value="false">Lacunes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Toutes</SelectItem>
                  <SelectItem value="true">Actives</SelectItem>
                  <SelectItem value="false">Archivées</SelectItem>
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
                  <TableHead className="w-24">Code</TableHead>
                  <TableHead className="w-32">Langue</TableHead>
                  <TableHead className="w-32">Catégorie</TableHead>
                  <TableHead className="w-28">Profession</TableHead>
                  <TableHead className="w-24">Niveaux</TableHead>
                  <TableHead>Texte</TableHead>
                  <TableHead className="w-24">Tonalité</TableHead>
                  <TableHead className="w-20">Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : phrases?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune phrase trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  phrases?.map((phrase) => (
                    <TableRow key={phrase.id}>
                      <TableCell className="font-mono text-xs">
                        {phrase.code || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="mr-1">{LANGUAGE_FLAGS[phrase.language]}</span>
                        <span className="text-sm">
                          {LANGUAGE_LABELS[phrase.language] || phrase.language}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {CATEGORY_LABELS[phrase.category] || phrase.category}
                      </TableCell>
                      <TableCell className="text-sm">
                        {phrase.profession 
                          ? PROFESSION_LABELS[phrase.profession] || phrase.profession
                          : "Tous"
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {phrase.level_min && phrase.level_max
                          ? `${phrase.level_min}-${phrase.level_max}`
                          : phrase.level_min || phrase.level_max || "Tous"
                        }
                      </TableCell>
                      <TableCell>
                        <span 
                          className="text-sm line-clamp-2" 
                          title={phrase.text_fr}
                        >
                          {phrase.text_fr}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={phrase.is_positive ? "default" : "secondary"}
                          className={phrase.is_positive
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                          }
                        >
                          {phrase.is_positive ? "Positif" : "Lacune"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={phrase.active ? "default" : "outline"}>
                          {phrase.active ? "Actif" : "Archivé"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(phrase)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Éditer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(phrase)}>
                              <Archive className="h-4 w-4 mr-2" />
                              {phrase.active ? "Archiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedPhrase(phrase);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPhrase ? "Modifier la phrase" : "Nouvelle phrase"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: INT-0-01"
              />
            </div>

            <div className="space-y-2">
              <Label>Langue</Label>
              <Select
                value={formData.language}
                onValueChange={(v) => setFormData({ ...formData, language: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_FLAGS[lang]} {LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Profession (optionnel)</Label>
              <Select
                value={formData.profession}
                onValueChange={(v) => setFormData({ ...formData, profession: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {PROFESSIONS.map((prof) => (
                    <SelectItem key={prof} value={prof}>
                      {PROFESSION_LABELS[prof]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Niveau minimum</Label>
              <Select
                value={formData.level_min}
                onValueChange={(v) => setFormData({ ...formData, level_min: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Niveau maximum</Label>
              <Select
                value={formData.level_max}
                onValueChange={(v) => setFormData({ ...formData, level_max: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Texte de la phrase</Label>
              <Textarea
                value={formData.text_fr}
                onChange={(e) => setFormData({ ...formData, text_fr: e.target.value })}
                placeholder="Entrez le texte de la phrase..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_positive"
                  checked={formData.is_positive}
                  onCheckedChange={(v) => setFormData({ ...formData, is_positive: v })}
                />
                <Label htmlFor="is_positive">
                  {formData.is_positive ? "Phrase positive" : "Lacune / Point négatif"}
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="order">Ordre</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.text_fr.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {selectedPhrase ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette phrase ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La phrase sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importer des phrases</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Coller le JSON ou charger un fichier</Label>
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{"phrases": [...]}'
                rows={8}
              />
            </div>

            <Button variant="outline" onClick={handleImportPreview}>
              Prévisualiser
            </Button>

            {importPreview.length > 0 && (
              <div className="border rounded-lg p-4">
                <p className="font-medium mb-2">
                  {importPreview.length} phrases à importer
                </p>
                <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground">
                  {importPreview.slice(0, 5).map((p, i) => (
                    <div key={i} className="truncate">
                      {p.code || `#${i + 1}`}: {p.text_fr?.substring(0, 50)}...
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <div className="text-muted-foreground">
                      ... et {importPreview.length - 5} autres
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleImport}
              disabled={importPreview.length === 0 || importMutation.isPending}
            >
              Importer {importPreview.length} phrases
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
