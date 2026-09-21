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
import { Label } from "@/components/ui/label";
import { Plus, Search, UserCog } from "lucide-react";
import { useInstructors, useUpdateInstructor, type Instructor } from "@/hooks/useInstructors";
import { InstructorCard } from "@/components/formateurs/InstructorCard";
import { InstructorFormDialog } from "@/components/formateurs/InstructorFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { EmptyState } from "@/components/common/EmptyState";
import { CardGridSkeleton } from "@/components/common/ListSkeleton";
import { PORTUGUESE_LABEL_LOWER } from "@/lib/taught-languages";
import {
  activationConfirmDescription,
  candidatActivationGaps,
} from "@/lib/instructor-candidat";
import { useConfirmAction } from "@/hooks/useConfirmAction";

export default function InstructorsList() {
  const navigate = useNavigate();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("formateurs");
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"actif" | "inactif" | "candidat" | "all">("actif");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const updateInstructor = useUpdateInstructor();
  const { confirm, dialog: confirmDialog } = useConfirmAction();

  const { data: instructors = [], isLoading } = useInstructors({
    search,
    language: langFilter !== "all" ? langFilter : undefined,
    availability: availFilter !== "all" ? availFilter : undefined,
    status: statusFilter,
  });

  const activateCandidat = (instructor: Instructor) => {
    const gaps = candidatActivationGaps(instructor);
    confirm({
      title: "Passer en actif·ve ?",
      description: activationConfirmDescription(gaps),
      actionLabel: "Confirmer",
      run: () =>
        updateInstructor.mutateAsync({
          id: instructor.id,
          status: "actif",
          is_active: true,
        }),
    });
  };

  const emptyTitle =
    statusFilter === "candidat"
      ? "Aucun·e candidat·e"
      : statusFilter === "inactif"
        ? "Aucun·e formateur·rice inactif·ve"
        : "Aucun formateur";

  const emptyDescription =
    statusFilter === "candidat"
      ? "Les nouveaux formateurs créés apparaissent ici en candidat·e jusqu'à activation."
      : "Ajoutez votre premier formateur pour commencer à organiser le planning et les paiements.";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Formateur·rices</h1>
            <p className="text-muted-foreground">
              Gérez les formateurs, leur planning et leurs paiements
            </p>
          </div>
          {editable && (
            <Button onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un·e formateur·rice
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
          <div className="space-y-1">
            <Label htmlFor="instructor-lang-filter">Langue</Label>
            <Select value={langFilter} onValueChange={setLangFilter}>
              <SelectTrigger id="instructor-lang-filter" className="w-[190px]">
                <SelectValue placeholder="Langue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="anglais">Anglais</SelectItem>
                <SelectItem value={PORTUGUESE_LABEL_LOWER}>Portugais brésilien</SelectItem>
                <SelectItem value="russe">Russe</SelectItem>
                <SelectItem value="néerlandais">Néerlandais</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="instructor-status-filter">Statut</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger id="instructor-status-filter" className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif·ves</SelectItem>
                <SelectItem value="inactif">Inactif·ves</SelectItem>
                <SelectItem value="candidat">Candidat·es</SelectItem>
                <SelectItem value="all">Tous</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="instructor-avail-filter">Disponibilité</Label>
            <Select value={availFilter} onValueChange={setAvailFilter}>
              <SelectTrigger id="instructor-avail-filter" className="w-[160px]">
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
        </div>

        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : instructors.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title={emptyTitle}
            description={emptyDescription}
            action={editable ? {
              label: "Ajouter un·e formateur·rice",
              icon: Plus,
              onClick: () => {
                setEditing(null);
                setShowForm(true);
              },
            } : undefined}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map((inst) => (
              <InstructorCard
                key={inst.id}
                instructor={inst}
                onClick={() => navigate(`/formateurs/${inst.id}`)}
                onEdit={
                  editable
                    ? () => {
                        setEditing(inst);
                        setShowForm(true);
                      }
                    : undefined
                }
                onActivate={
                  editable && inst.status === "candidat"
                    ? () => activateCandidat(inst)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <InstructorFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditing(null);
        }}
        instructor={editing}
      />
      {confirmDialog}
    </MainLayout>
  );
}
