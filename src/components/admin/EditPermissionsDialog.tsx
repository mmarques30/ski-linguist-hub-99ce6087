import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";

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
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
            Modifier les permissions
          </DialogTitle>
          <DialogDescription>
            Cochez « Voir » pour donner l&apos;accès à une page, « Modifier » pour
            autoriser l&apos;écriture. Seules les lignes cochées sont enregistrées.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-2" aria-busy="true">
            <span className="sr-only">Chargement...</span>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-12 w-full rounded-[var(--radius)]" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <UserPermissionsEditor
              permissions={permissions}
              onChange={setPermissions}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
