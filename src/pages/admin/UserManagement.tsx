import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Shield, User, ToggleLeft, ToggleRight, Settings2 } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { EditPermissionsDialog } from "@/components/admin/EditPermissionsDialog";
import { useToast } from "@/hooks/use-toast";

export default function UserManagement() {
  const { users, isLoading, createUser, toggleUserActive } = useUserManagement();
  const [formOpen, setFormOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreate = async (data: Parameters<typeof createUser.mutateAsync>[0]) => {
    try {
      await createUser.mutateAsync(data);
      toast({ title: "Utilisateur créé avec succès" });
      setFormOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await toggleUserActive.mutateAsync({ userId, isActive: !currentActive });
      toast({ title: currentActive ? "Utilisateur désactivé" : "Utilisateur activé" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground text-sm">
              Gérez les accès et permissions de chaque utilisateur
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.full_name || u.email}
                        {!u.has_complete_profile && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-300 text-orange-600 bg-orange-50">
                            Profil incomplet
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role === "admin" ? (
                          <><Shield className="h-3 w-3 mr-1" />Admin</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" />Utilisateur</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "default" : "outline"}>
                        {u.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {u.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditUserId(u.id)}
                            title="Modifier les permissions"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          title={u.is_active ? "Désactiver" : "Activer"}
                        >
                          {u.is_active ? (
                            <ToggleRight className="h-4 w-4 text-primary" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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
    </MainLayout>
  );
}
