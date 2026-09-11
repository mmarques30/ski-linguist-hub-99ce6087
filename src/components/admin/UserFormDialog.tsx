import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPermissionsEditor,
  PermissionEntry,
} from "./UserPermissionsEditor";
import { ALL_ROUTE_KEYS } from "@/lib/route-permissions";
import { useInstructors } from "@/hooks/useInstructors";

type StaffRole = "admin" | "user" | "formateur";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    email: string;
    password: string;
    full_name: string;
    role: StaffRole;
    permissions: PermissionEntry[];
    instructor_id?: string;
  }) => void;
  loading?: boolean;
}

export function UserFormDialog({ open, onOpenChange, onSubmit, loading }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("user");
  const [instructorId, setInstructorId] = useState<string>("");
  const [permissions, setPermissions] = useState<PermissionEntry[]>(
    ALL_ROUTE_KEYS.map((key) => ({ route_key: key, can_view: false, can_edit: false }))
  );
  const { data: instructors = [] } = useInstructors({ status: "actif" });
  const availableInstructors = instructors.filter((i) => !i.auth_user_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "formateur" && !instructorId) return;
    onSubmit({
      email,
      password,
      full_name: fullName,
      role,
      permissions: role === "user" ? permissions.filter((p) => p.can_view || p.can_edit) : [],
      instructor_id: role === "formateur" ? instructorId : undefined,
    });
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("user");
    setInstructorId("");
    setPermissions(
      ALL_ROUTE_KEYS.map((key) => ({ route_key: key, can_view: false, can_edit: false }))
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe temporaire</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={72}
            />
          </div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as StaffRole);
                if (v !== "formateur") setInstructorId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="formateur">Formateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "formateur" && (
            <div className="space-y-2">
              <Label>Fiche formateur</Label>
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une fiche instructors" />
                </SelectTrigger>
                <SelectContent>
                  {availableInstructors.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Aucune fiche disponible (déjà liée ou aucune fiche actif)
                    </SelectItem>
                  ) : (
                    availableInstructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {[i.last_name, i.first_name].filter(Boolean).join(" ")}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {role === "user" && (
            <div className="space-y-2">
              <Label>Permissions</Label>
              <UserPermissionsEditor
                permissions={permissions}
                onChange={setPermissions}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || (role === "formateur" && !instructorId)}>
              {loading ? "Création..." : "Créer l'utilisateur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
