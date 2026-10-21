import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormateurCecrlLevelSelect } from "@/components/formateur/FormateurCecrlLevelSelect";
import {
  FORMATION_TYPE_LABELS,
  FORMATION_TYPE_VALUES,
  type FormationTypeFormateur,
  type FormulaireEntreeFormateur,
} from "@/lib/formateur-formation-forms";

export function FormateurEntryFormFields({
  fields,
  onChange,
  suggestedGeneralEntry,
}: {
  fields: FormulaireEntreeFormateur;
  onChange: <K extends keyof FormulaireEntreeFormateur>(
    key: K,
    value: FormulaireEntreeFormateur[K]
  ) => void;
  suggestedGeneralEntry?: string | null;
}) {
  const isCollective = fields.type_formation === "collective";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Type de formation <span className="text-destructive">*</span>
        </Label>
        <Select
          value={fields.type_formation}
          onValueChange={(v) =>
            onChange("type_formation", v as FormationTypeFormateur)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATION_TYPE_VALUES.map((v) => (
              <SelectItem key={v} value={v}>
                {FORMATION_TYPE_LABELS[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCollective ? (
        <>
          <FormateurCecrlLevelSelect
            id="niveau_general_groupe"
            label="Niveau général du groupe en début de formation"
            value={fields.niveau_general_groupe}
            onChange={(v) => onChange("niveau_general_groupe", v)}
            mode="cecrl"
            required
          />
          <div className="space-y-2">
            <Label htmlFor="remarques_groupe">
              Remarques sur le niveau du groupe (homogénéité…){" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="remarques_groupe"
              rows={2}
              value={fields.remarques_groupe || ""}
              onChange={(e) => onChange("remarques_groupe", e.target.value)}
            />
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Niveau du stagiaire en début de formation
        </p>
        <p className="text-xs text-muted-foreground">
          Échelle CECRL (demi-niveaux). Choisis « Non évaluée » si la compétence
          n&apos;a pas été observée.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormateurCecrlLevelSelect
            id="ce"
            label="Compréhension écrite"
            value={fields.comprehension_ecrite}
            onChange={(v) => onChange("comprehension_ecrite", v)}
            required
          />
          <FormateurCecrlLevelSelect
            id="co"
            label="Compréhension orale"
            value={fields.comprehension_orale}
            onChange={(v) => onChange("comprehension_orale", v)}
            required
          />
          <FormateurCecrlLevelSelect
            id="ee"
            label="Expression écrite"
            value={fields.expression_ecrite}
            onChange={(v) => onChange("expression_ecrite", v)}
            required
          />
          <FormateurCecrlLevelSelect
            id="eo"
            label="Expression orale"
            value={fields.expression_orale}
            onChange={(v) => onChange("expression_orale", v)}
            required
          />
          <FormateurCecrlLevelSelect
            id="gram"
            label="Connaissances grammaticales"
            value={fields.connaissances_grammaticales}
            onChange={(v) => onChange("connaissances_grammaticales", v)}
            required
          />
        </div>
      </div>

      {suggestedGeneralEntry ? (
        <p className="text-xs text-muted-foreground">
          Indicatif test de placement (ne pas recopier tel quel) :{" "}
          {suggestedGeneralEntry}
        </p>
      ) : null}

      {!isCollective ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="attentes">
              Attentes du stagiaire <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="attentes"
              rows={2}
              value={fields.attentes_stagiaire || ""}
              onChange={(e) => onChange("attentes_stagiaire", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="competences">
              Compétences à développer{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="competences"
              rows={2}
              value={fields.competences_a_developper || ""}
              onChange={(e) =>
                onChange("competences_a_developper", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="themes">
              Thèmes à travailler <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="themes"
              rows={2}
              value={fields.themes_a_travailler || ""}
              onChange={(e) => onChange("themes_a_travailler", e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="attentes_g">
              Attentes du groupe <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="attentes_g"
              rows={2}
              value={fields.attentes_groupe || ""}
              onChange={(e) => onChange("attentes_groupe", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="competences_g">
              Compétences à développer{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="competences_g"
              rows={2}
              value={fields.competences_groupe || ""}
              onChange={(e) => onChange("competences_groupe", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="themes_g">
              Thèmes à travailler <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="themes_g"
              rows={2}
              value={fields.themes_groupe || ""}
              onChange={(e) => onChange("themes_groupe", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="absents">
              Nom / prénom des absents aujourd&apos;hui
            </Label>
            <Textarea
              id="absents"
              rows={2}
              value={fields.absents || ""}
              onChange={(e) => onChange("absents", e.target.value)}
              placeholder="Laisser vide si tout le monde est présent"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="moyens">
          Adéquation des moyens mis à disposition (salle, matériel, connexion…){" "}
          <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="moyens"
          rows={2}
          value={fields.adequation_moyens || ""}
          onChange={(e) => onChange("adequation_moyens", e.target.value)}
        />
      </div>
    </div>
  );
}
