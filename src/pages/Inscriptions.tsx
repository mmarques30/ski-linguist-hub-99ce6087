import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, ClipboardList, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInscriptions } from "@/hooks/useInscriptions";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusStyles: Record<string, string> = {
  "En cours": "bg-blue-100 text-blue-800",
  "Facturé": "bg-emerald-100 text-emerald-800",
  "Terminé": "bg-gray-100 text-gray-800",
  "Annulé": "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  "En cours": "En cours",
  "Facturé": "Facturée",
  "Terminé": "Terminée",
  "Annulé": "Annulée",
};

export default function Inscriptions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: inscriptions, isLoading, error } = useInscriptions({
    status: statusFilter,
    language: languageFilter,
    search: search || undefined,
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inscriptions</h1>
            <p className="text-muted-foreground">
              Gérer les inscriptions et candidatures des stagiaires
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/import">
                <Upload className="mr-2 h-4 w-4" />
                Importer CSV
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle inscription
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou code..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Facturé">Facturée</SelectItem>
              <SelectItem value="Terminé">Terminée</SelectItem>
              <SelectItem value="Annulé">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les langues</SelectItem>
              <SelectItem value="Anglais">Anglais</SelectItem>
              <SelectItem value="Portugais brésilien">Portugais</SelectItem>
              <SelectItem value="Italien">Italien</SelectItem>
              <SelectItem value="Allemand">Allemand</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-destructive/50 mb-4" />
              <h3 className="text-lg font-medium">Erreur de chargement</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {error.message}
              </p>
            </div>
          ) : !inscriptions || inscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Aucune inscription trouvée</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Les inscriptions apparaîtront ici lorsque les stagiaires s'inscriront ou après importation de données.
              </p>
              <Button asChild className="mt-4">
                <Link to="/admin/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Importer CSV
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>École de ski</TableHead>
                  <TableHead>Langue</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions.map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell className="font-mono text-sm">
                      {inscription.code || "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inscription.student_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {inscription.student_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{inscription.ski_school_name || "-"}</TableCell>
                    <TableCell>{inscription.language}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{inscription.entry_level || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(inscription.start_date)} - {formatDate(inscription.end_date)}
                      </span>
                    </TableCell>
                    <TableCell>{formatPrice(inscription.price)}</TableCell>
                    <TableCell>
                      <Badge className={cn(statusStyles[inscription.status] || "bg-gray-100 text-gray-800", "hover:opacity-80")}>
                        {statusLabels[inscription.status] || inscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage de {inscriptions?.length || 0} inscriptions
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled>
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
