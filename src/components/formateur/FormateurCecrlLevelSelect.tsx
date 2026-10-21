import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FORMATEUR_CECRL_LEVELS,
  FORMATEUR_SKILL_LEVEL_OPTIONS,
  FORMATEUR_SKILL_UNEVALUATED,
  isUnevaluatedSkillLevel,
} from "@/lib/formateur-formation-forms";

type Mode = "cecrl" | "skill";

/**
 * Sélecteur CECRL (synthèse) ou compétence (CECRL + « Non évaluée »).
 * Tolère les anciennes libellés Google Form à l'affichage.
 */
export function FormateurCecrlLevelSelect({
  id,
  label,
  value,
  onChange,
  mode = "skill",
  required,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  mode?: Mode;
  required?: boolean;
}) {
  const options =
    mode === "cecrl" ? FORMATEUR_CECRL_LEVELS : FORMATEUR_SKILL_LEVEL_OPTIONS;

  const normalized =
    value && isUnevaluatedSkillLevel(value)
      ? FORMATEUR_SKILL_UNEVALUATED
      : value || undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </Label>
      <Select value={normalized} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((level) => (
            <SelectItem key={level} value={level}>
              {level}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
