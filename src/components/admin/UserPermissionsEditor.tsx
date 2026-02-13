import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ROUTE_GROUPS } from "@/lib/route-permissions";

export interface PermissionEntry {
  route_key: string;
  can_view: boolean;
  can_edit: boolean;
}

interface Props {
  permissions: PermissionEntry[];
  onChange: (permissions: PermissionEntry[]) => void;
}

export function UserPermissionsEditor({ permissions, onChange }: Props) {
  const getPerm = (key: string) =>
    permissions.find((p) => p.route_key === key) || {
      route_key: key,
      can_view: false,
      can_edit: false,
    };

  const setPerm = (key: string, field: "can_view" | "can_edit", value: boolean) => {
    const existing = permissions.filter((p) => p.route_key !== key);
    const current = getPerm(key);
    const updated = { ...current, route_key: key, [field]: value };
    // If can_edit is true, force can_view to true
    if (field === "can_edit" && value) {
      updated.can_view = true;
    }
    // If can_view is false, force can_edit to false
    if (field === "can_view" && !value) {
      updated.can_edit = false;
    }
    onChange([...existing, updated]);
  };

  const toggleGroupAll = (groupRoutes: string[], checked: boolean) => {
    const otherPerms = permissions.filter(
      (p) => !groupRoutes.includes(p.route_key)
    );
    const groupPerms = groupRoutes.map((key) => ({
      route_key: key,
      can_view: checked,
      can_edit: checked,
    }));
    onChange([...otherPerms, ...groupPerms]);
  };

  return (
    <Accordion type="multiple" defaultValue={ROUTE_GROUPS.map((g) => g.label)} className="w-full">
      {ROUTE_GROUPS.map((group) => {
        const groupKeys = group.routes.map((r) => r.key);
        const allChecked = groupKeys.every((k) => getPerm(k).can_view);

        return (
          <AccordionItem key={group.label} value={group.label}>
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(v) => {
                    toggleGroupAll(groupKeys, !!v);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>{group.label}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4">
                <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-xs text-muted-foreground font-medium pb-1 border-b">
                  <span>Page</span>
                  <span className="text-center">Voir</span>
                  <span className="text-center">Modifier</span>
                </div>
                {group.routes.map((route) => {
                  const perm = getPerm(route.key);
                  return (
                    <div
                      key={route.key}
                      className="grid grid-cols-[1fr_80px_80px] gap-2 items-center py-1"
                    >
                      <span className="text-sm">{route.label}</span>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={perm.can_view}
                          onCheckedChange={(v) =>
                            setPerm(route.key, "can_view", !!v)
                          }
                        />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={perm.can_edit}
                          onCheckedChange={(v) =>
                            setPerm(route.key, "can_edit", !!v)
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
