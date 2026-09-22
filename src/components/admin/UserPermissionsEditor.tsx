import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ROUTE_GROUPS } from "@/lib/route-permissions";
import { StatusPill } from "@/components/ui-kit";

export interface PermissionEntry {
  route_key: string;
  can_view: boolean;
  can_edit: boolean;
}

interface Props {
  permissions: PermissionEntry[];
  onChange: (permissions: PermissionEntry[]) => void;
}

/**
 * Matrice de permissions : une section par groupe de routes, une ligne par
 * clé de route, deux colonnes « Voir » / « Modifier ».
 *
 * Sous `sm`, les colonnes ne sont pas comprimées : la ligne s'empile et
 * chaque case porte son propre libellé visible.
 */
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
    <Accordion
      type="multiple"
      defaultValue={ROUTE_GROUPS.map((g) => g.label)}
      className="w-full space-y-2"
    >
      {ROUTE_GROUPS.map((group) => {
        const groupKeys = group.routes.map((r) => r.key);
        const allChecked = groupKeys.every((k) => getPerm(k).can_view);
        const grantedCount = groupKeys.filter((k) => getPerm(k).can_view).length;

        return (
          <AccordionItem
            key={group.label}
            value={group.label}
            className="overflow-hidden rounded-[var(--radius)] border border-border bg-card"
          >
            <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:no-underline">
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2">
                <span className="flex min-w-0 items-center gap-3">
                  <Checkbox
                    checked={allChecked}
                    aria-label={`Tout cocher — ${group.label}`}
                    onCheckedChange={(v) => {
                      toggleGroupAll(groupKeys, !!v);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="truncate text-left">{group.label}</span>
                </span>
                <StatusPill tone={grantedCount > 0 ? "info" : "neutral"} size="sm">
                  {grantedCount}/{groupKeys.length}
                </StatusPill>
              </div>
            </AccordionTrigger>

            <AccordionContent className="border-t border-border pb-0">
              {/* En-tête de colonnes — masqué quand la ligne s'empile. */}
              <div className="hidden grid-cols-[minmax(0,1fr)_72px_72px] gap-2 bg-[hsl(var(--surface-sunken))] px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Page</span>
                <span className="text-center">Voir</span>
                <span className="text-center">Modifier</span>
              </div>

              <div className="divide-y divide-border">
                {group.routes.map((route) => {
                  const perm = getPerm(route.key);
                  return (
                    <div
                      key={route.key}
                      className="flex flex-col gap-2 px-3 py-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_72px_72px] sm:items-center sm:gap-2"
                    >
                      <span className="min-w-0 text-sm text-foreground sm:truncate">
                        {route.label}
                      </span>

                      <div className="flex items-center gap-4 sm:contents">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground sm:justify-center sm:gap-0">
                          <Checkbox
                            checked={perm.can_view}
                            aria-label={`Voir — ${route.label}`}
                            onCheckedChange={(v) =>
                              setPerm(route.key, "can_view", !!v)
                            }
                          />
                          <span className="sm:hidden">Voir</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground sm:justify-center sm:gap-0">
                          <Checkbox
                            checked={perm.can_edit}
                            aria-label={`Modifier — ${route.label}`}
                            onCheckedChange={(v) =>
                              setPerm(route.key, "can_edit", !!v)
                            }
                          />
                          <span className="sm:hidden">Modifier</span>
                        </label>
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
