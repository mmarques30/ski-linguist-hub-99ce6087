import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, UserCog } from "lucide-react";
import { useInstructors } from "@/hooks/useInstructors";
import { InstructorCard } from "@/components/formateurs/InstructorCard";
import { InstructorFormDialog } from "@/components/formateurs/InstructorFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { EmptyState } from "@/components/common/EmptyState";
import { CardGridSkeleton } from "@/components/common/ListSkeleton";

export default function InstructorsList() {
  const navigate = useNavigate();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("formateurs");
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const { data: instructors = [], isLoading } = useInstructors({
    search,
    language: langFilter !== "all" ? langFilter : undefined,
    availability: availFilter !== "all" ? availFilter : undefined,
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Formateurs</h1>
            <p className="text-muted-foreground">
              Gérez les formateurs, leur planning et leurs paiements
            </p>
          </div>
          {editable && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un formateur
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={langFilter} onValueChange={setLangFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="Anglais">Anglais</SelectItem>
              <SelectItem value="Portugais">Portugais</SelectItem>
              <SelectItem value="Russe">Russe</SelectItem>
              <SelectItem value="Néerlandais">Néerlandais</SelectItem>
            </SelectContent>
          </Select>
          <Select value={availFilter} onValueChange={setAvailFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Disponibilité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="occupe">Occupé</SelectItem>
              <SelectItem value="indisponible">Indisponible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : instructors.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="Aucun formateur"
            description="Ajoutez votre premier formateur pour commencer à organiser le planning et les paiements."
            action={editable ? {
              label: "Ajouter un formateur",
              icon: Plus,
              onClick: () => setShowForm(true),
            } : undefined}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map((inst) => (
              <InstructorCard
                key={inst.id}
                instructor={inst}
                onClick={() => navigate(`/formateurs/${inst.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <InstructorFormDialog open={showForm} onOpenChange={setShowForm} />
    </MainLayout>
  );
}
