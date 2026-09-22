import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Shield,
  User,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  Settings2,
  Users,
} from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { EditPermissionsDialog } from "@/components/admin/EditPermissionsDialog";
import { useToast } from "@/hooks/use-toast";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import {
  CardList,
  CardListItem,
  IdentityCell,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
  type PillTone,
} from "@/components/ui-kit";

/** Rôle → libellé + icône + teinte. Le libellé reste celui affiché aujourd'hui. */
const ROLE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: PillTone }> = {
  admin: { label: "Admin", icon: Shield, tone: "accent" },
  formateur: { label: "Formateur", icon: GraduationCap, tone: "info" },
  student: { label: "Stagiaire", icon: User, tone: "purple" },
};
const DEFAULT_ROLE_META = { label: "Utilisateur", icon: User, tone: "neutral" as PillTone };

export default function UserManagement() {
  const { users, isLoading, createUser, toggleUserActive } = useUserManagement();
  const [formOpen, setFormOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmAction();

  const handleCreate = (data: Parameters<typeof createUser.mutateAsync>[0]) => {
    confirm({
      title: "Créer cet utilisateur ?",
      description: "Un compte d'accès sera créé avec le rôle choisi.",
      run: async () => {
        try {
          await createUser.mutateAsync(data);
          toast({ title: "Utilisateur créé avec succès" });
          setFormOpen(false);
        } catch (err: unknown) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: err instanceof Error ? err.message : "Erreur",
          });
        }
      },
    });
  };

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    confirm({
      title: currentActive ? "Désactiver cet utilisateur ?" : "Activer cet utilisateur ?",
      description: currentActive
        ? "L'utilisateur ne pourra plus se connecter."
        : "L'utilisateur retrouvera l'accès à l'application.",
      run: async () => {
        try {
          await toggleUserActive.mutateAsync({ userId, isActive: !currentActive });
          toast({ title: currentActive ? "Utilisateur désactivé" : "Utilisateur activé" });
        } catch (err: unknown) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: err instanceof Error ? err.message : "Erreur",
          });
        }
      },
    });
  };

  const roleMeta = (role: string) => ROLE_META[role] ?? DEFAULT_ROLE_META;

  const rowActions = (u: (typeof users)[number]) => (
    <>
      {u.role === "user" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditUserId(u.id)}
          title="Modifier les permissions"
          aria-label={`Modifier les permissions de ${u.full_name || u.email}`}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleToggleActive(u.id, u.is_active)}
        title={u.is_active ? "Désactiver" : "Activer"}
        aria-label={`${u.is_active ? "Désactiver" : "Activer"} ${u.full_name || u.email}`}
      >
        {u.is_active ? (
          <ToggleRight className="h-4 w-4 text-primary" />
        ) : (
          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </>
  );

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Gestion des utilisateurs"
          description="Gérez les accès et permissions de chaque utilisateur"
          icon={Users}
          tone="navy"
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          }
        />

        <SurfaceCard flush>
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : users.length === 0 ? (
            <TableEmpty
              title="Aucun utilisateur"
              description="Aucun compte d'accès n'est encore provisionné."
              icon={Users}
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un utilisateur
                </Button>
              }
            />
          ) : (
            <>
              <TableFrame>
                <table className="hidden w-full md:table">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Nom</TableHeadCell>
                      <TableHeadCell className="hidden lg:table-cell">Email</TableHeadCell>
                      <TableHeadCell>Rôle</TableHeadCell>
                      <TableHeadCell>Statut</TableHeadCell>
                      <TableHeadCell align="right">Actions</TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const meta = roleMeta(u.role);
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <IdentityCell
                                name={u.full_name || u.email}
                                secondary={<span className="lg:hidden">{u.email}</span>}
                              />
                              {!u.has_complete_profile && (
                                <StatusPill tone="warning" size="sm">
                                  Profil incomplet
                                </StatusPill>
                              )}
                            </div>
                          </TableCell>
                          <TableCell hideBelow="lg" className="text-muted-foreground">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <StatusPill tone={meta.tone} icon={meta.icon} size="sm">
                              {meta.label}
                            </StatusPill>
                          </TableCell>
                          <TableCell>
                            <StatusPill tone={u.is_active ? "success" : "neutral"} size="sm" dot>
                              {u.is_active ? "Actif" : "Inactif"}
                            </StatusPill>
                          </TableCell>
                          <TableCell align="right">
                            <div className="flex justify-end gap-1">{rowActions(u)}</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </table>
              </TableFrame>

              {/* Doublure mobile du tableau — mêmes colonnes, mêmes actions. */}
              <CardList className="md:hidden">
                {users.map((u) => {
                  const meta = roleMeta(u.role);
                  return (
                    <CardListItem
                      key={u.id}
                      title={u.full_name || u.email}
                      subtitle={u.email}
                      meta={
                        <StatusPill tone={u.is_active ? "success" : "neutral"} size="sm" dot>
                          {u.is_active ? "Actif" : "Inactif"}
                        </StatusPill>
                      }
                      fields={[
                        { label: "Rôle", value: meta.label },
                        {
                          label: "Profil",
                          value: u.has_complete_profile ? "Complet" : "Incomplet",
                        },
                      ]}
                      actions={rowActions(u)}
                    />
                  );
                })}
              </CardList>
            </>
          )}
        </SurfaceCard>
      </PageShell>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        loading={createUser.isPending}
      />

      <EditPermissionsDialog
        userId={editUserId}
        open={!!editUserId}
        onOpenChange={(open) => { if (!open) setEditUserId(null); }}
      />
      {confirmDialog}
    </MainLayout>
  );
}
