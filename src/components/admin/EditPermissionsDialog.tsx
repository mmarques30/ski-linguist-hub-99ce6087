import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UserPermissionsEditor,
  PermissionEntry,
} from "./UserPermissionsEditor";
import {
  useUserManagement,
  useUserPermissionsForUser,
} from "@/hooks/useUserManagement";
import { ALL_ROUTE_KEYS } from "@/lib/route-permissions";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPermissionsDialog({ userId, open, onOpenChange }: Props) {
  const { data: existingPerms = [], isLoading } = useUserPermissionsForUser(
    open ? userId : null
  );
  const { updatePermissions } = useUserManagement();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionEntry[]>([]);

  useEffect(() => {
    if (existingPerms.length > 0) {
      const full = ALL_ROUTE_KEYS.map((key) => {
        const existing = existingPerms.find((p) => p.route_key === key);
        return {
          route_key: key,
          can_view: existing?.can_view ?? false,
          can_edit: existing?.can_edit ?? false,
        };
      });
      setPermissions(full);
    } else if (!isLoading) {
      setPermissions(
        ALL_ROUTE_KEYS.map((key) => ({
          route_key: key,
          can_view: false,
          can_edit: false,
        }))
      );
    }
  }, [existingPerms, isLoading]);

  const handleSave = async () => {
    if (!userId) return;
    try {
      await updatePermissions.mutateAsync({
        userId,
        permissions: permissions.filter((p) => p.can_view || p.can_edit),
      });
      toast({ title: "Permissions mises à jour" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les permissions</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground text-sm py-4">Chargement...</p>
        ) : (
          <div className="space-y-4">
            <UserPermissionsEditor
              permissions={permissions}
              onChange={setPermissions}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={updatePermissions.isPending}
              >
                {updatePermissions.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
