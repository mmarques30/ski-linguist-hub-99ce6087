import { Label } from "@/components/ui/label";
import { FormateurCecrlLevelSelect } from "@/components/formateur/FormateurCecrlLevelSelect";
import type { FormateurStagiaireNiveauRow } from "@/lib/formateur-stagiaire-niveaux";

/**
 * Grille « un niveau (général + technique) par stagiaire » — début ou fin.
 */
export function FormateurStagiairesNiveauxTable({
  rows,
  onChange,
  kind,
}: {
  rows: FormateurStagiaireNiveauRow[];
  onChange: (next: FormateurStagiaireNiveauRow[]) => void;
  kind: "entree" | "sortie";
}) {
  const title =
    kind === "entree"
      ? "Niveau de chaque stagiaire en début de formation"
      : "Niveau de chaque stagiaire en fin de formation";

  const update = (
    inscriptionId: string,
    patch: Partial<FormateurStagiaireNiveauRow>
  ) => {
    onChange(
      rows.map((r) =>
        r.inscription_id === inscriptionId ? { ...r, ...patch } : r
      )
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          Général + technique (CECRL) pour chaque personne du groupe. Obligatoire.
        </p>
      </div>
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={row.inscription_id}
            className="rounded-[var(--radius)] border border-border p-3"
          >
            <Label className="mb-2 block text-sm font-medium">
              {index + 1}. {row.student_name}
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormateurCecrlLevelSelect
                id={`${kind}-gen-${row.inscription_id}`}
                label="Niveau général"
                value={row.niveau_general}
                onChange={(v) =>
                  update(row.inscription_id, { niveau_general: v })
                }
                mode="cecrl"
                required
              />
              <FormateurCecrlLevelSelect
                id={`${kind}-tech-${row.inscription_id}`}
                label="Niveau technique"
                value={row.niveau_technique}
                onChange={(v) =>
                  update(row.inscription_id, { niveau_technique: v })
                }
                mode="cecrl"
                required
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
