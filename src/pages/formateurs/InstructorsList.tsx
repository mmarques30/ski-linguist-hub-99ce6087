import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, UserCog } from "lucide-react";
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
import {
  FilterBar,
  PageHeader,
  PageShell,
  SurfaceCard,
} from "@/components/ui-kit";

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

  const statusChipLabel: Record<string, string> = {
    actif: "Actif·ves",
    inactif: "Inactif·ves",
    candidat: "Candidat·es",
    all: "Tous",
  };

  /** Rappel des filtres actifs, retirables un à un. */
  const activeFilters = [
    search.trim()
      ? { key: "search", label: `« ${search.trim()} »`, onRemove: () => setSearch("") }
      : null,
    langFilter !== "all"
      ? { key: "lang", label: langFilter, onRemove: () => setLangFilter("all") }
      : null,
    statusFilter !== "actif"
      ? {
          key: "status",
          label: statusChipLabel[statusFilter] ?? statusFilter,
          onRemove: () => setStatusFilter("actif"),
        }
      : null,
    availFilter !== "all"
      ? { key: "avail", label: availFilter, onRemove: () => setAvailFilter("all") }
      : null,
  ].filter((chip): chip is { key: string; label: string; onRemove: () => void } => chip !== null);

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Formateur·rices"
          description="Gérez les formateurs, leur planning et leurs paiements"
          icon={UserCog}
          tone="teal"
          actions={
            editable ? (
              <Button onClick={() => { setEditing(null); setShowForm(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un·e formateur·rice
              </Button>
            ) : undefined
          }
        />

        <SurfaceCard>
          <FilterBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Rechercher...",
              ariaLabel: "Rechercher un·e formateur·rice",
            }}
            filters={
              <>
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="instructor-lang-filter" className="text-2xs uppercase tracking-wide text-muted-foreground">
                    Langue
                  </Label>
                  <Select value={langFilter} onValueChange={setLangFilter}>
                    <SelectTrigger id="instructor-lang-filter" className="w-full sm:w-[190px]">
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
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="instructor-status-filter" className="text-2xs uppercase tracking-wide text-muted-foreground">
                    Statut
                  </Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger id="instructor-status-filter" className="w-full sm:w-[160px]">
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
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="instructor-avail-filter" className="text-2xs uppercase tracking-wide text-muted-foreground">
                    Disponibilité
                  </Label>
                  <Select value={availFilter} onValueChange={setAvailFilter}>
                    <SelectTrigger id="instructor-avail-filter" className="w-full sm:w-[160px]">
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
              </>
            }
            activeFilters={activeFilters}
          />
        </SurfaceCard>

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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      </PageShell>

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
