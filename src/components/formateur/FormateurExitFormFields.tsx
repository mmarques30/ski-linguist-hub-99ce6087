import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  OBJECTIF_ATTEINT_LABELS,
  OBJECTIF_ATTEINT_VALUES,
  type ObjectifAtteint,
} from "@/lib/certificate-progression";
import {
  FORMATION_TYPE_LABELS,
  FORMATION_TYPE_VALUES,
  type FormationTypeFormateur,
  type FormulaireSortieFormateur,
} from "@/lib/formateur-formation-forms";

export function FormateurExitFormFields({
  fields,
  onChange,
  hours,
  onHoursChange,
  durationHours,
}: {
  fields: FormulaireSortieFormateur;
  onChange: <K extends keyof FormulaireSortieFormateur>(
    key: K,
    value: FormulaireSortieFormateur[K]
  ) => void;
  hours: number | "";
  onHoursChange: (v: number | "") => void;
  durationHours?: number | null;
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
            label="Niveau général du groupe en fin de formation"
            value={fields.niveau_general_groupe}
            onChange={(v) => onChange("niveau_general_groupe", v)}
            mode="cecrl"
            required
          />
          <div className="space-y-2">
            <Label htmlFor="hetero">Remarques sur l&apos;hétérogénéité</Label>
            <Textarea
              id="hetero"
              rows={2}
              value={fields.remarques_heterogeneite || ""}
              onChange={(e) =>
                onChange("remarques_heterogeneite", e.target.value)
              }
            />
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">Synthèse pour le certificat</p>
        <p className="text-xs text-muted-foreground">
          Obligatoire avant génération du certificat. Indépendant des tests
          oraux SNMSF / DSF.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormateurCecrlLevelSelect
            id="niveau_general"
            label="Niveau général (sortie)"
            value={fields.niveau_general}
            onChange={(v) => onChange("niveau_general", v)}
            mode="cecrl"
            required
          />
          <FormateurCecrlLevelSelect
            id="niveau_specifique"
            label="Niveau spécifique / technique"
            value={fields.niveau_specifique}
            onChange={(v) => onChange("niveau_specifique", v)}
            mode="cecrl"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Compétences en fin de formation</p>
        <p className="text-xs text-muted-foreground">
          Optionnel mais recommandé — même échelle qu&apos;à l&apos;entrée.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormateurCecrlLevelSelect
            id="ce"
            label="Compréhension écrite"
            value={fields.comprehension_ecrite}
            onChange={(v) => onChange("comprehension_ecrite", v)}
          />
          <FormateurCecrlLevelSelect
            id="co"
            label="Compréhension orale"
            value={fields.comprehension_orale}
            onChange={(v) => onChange("comprehension_orale", v)}
          />
          <FormateurCecrlLevelSelect
            id="ee"
            label="Expression écrite"
            value={fields.expression_ecrite}
            onChange={(v) => onChange("expression_ecrite", v)}
          />
          <FormateurCecrlLevelSelect
            id="eo"
            label="Expression orale"
            value={fields.expression_orale}
            onChange={(v) => onChange("expression_orale", v)}
          />
          <FormateurCecrlLevelSelect
            id="gram"
            label="Connaissances grammaticales"
            value={fields.connaissances_grammaticales}
            onChange={(v) => onChange("connaissances_grammaticales", v)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Objectif pédagogique atteint{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Select
          value={fields.objectif_atteint || "oui"}
          onValueChange={(v) =>
            onChange("objectif_atteint", v as ObjectifAtteint)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OBJECTIF_ATTEINT_VALUES.map((v) => (
              <SelectItem key={v} value={v}>
                {OBJECTIF_ATTEINT_LABELS[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {fields.objectif_atteint !== "oui" ? (
        <div className="space-y-2">
          <Label htmlFor="ecarts">Si non / partiel — préciser</Label>
          <Textarea
            id="ecarts"
            rows={2}
            value={fields.objectif_ecart_detail || ""}
            onChange={(e) => onChange("objectif_ecart_detail", e.target.value)}
          />
        </div>
      ) : null}

      {isCollective ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="obj_g">Objectifs du groupe atteints</Label>
            <Textarea
              id="obj_g"
              rows={2}
              value={fields.objectifs_groupe_atteints || ""}
              onChange={(e) =>
                onChange("objectifs_groupe_atteints", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="obj_ecarts_g">Écarts éventuels (groupe)</Label>
            <Textarea
              id="obj_ecarts_g"
              rows={2}
              value={fields.objectifs_groupe_ecarts || ""}
              onChange={(e) =>
                onChange("objectifs_groupe_ecarts", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dynamique">Dynamique de groupe</Label>
            <Textarea
              id="dynamique"
              rows={2}
              value={fields.commentaire_dynamique_groupe || ""}
              onChange={(e) =>
                onChange("commentaire_dynamique_groupe", e.target.value)
              }
            />
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="assiduite">
          Assiduité, comportement et investissement{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="assiduite"
          rows={3}
          value={fields.commentaire_assiduite || ""}
          onChange={(e) => onChange("commentaire_assiduite", e.target.value)}
          placeholder="Bilan sur l'investissement du stagiaire"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logistique">Moyens techniques et logistiques</Label>
        <Textarea
          id="logistique"
          rows={2}
          value={fields.commentaire_logistique || ""}
          onChange={(e) => onChange("commentaire_logistique", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hours_followed">
          Heures suivies
          {durationHours != null ? ` (prévues : ${durationHours} h)` : ""}
        </Label>
        <Input
          id="hours_followed"
          type="number"
          min={0}
          value={hours}
          onChange={(e) =>
            onHoursChange(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      </div>
    </div>
  );
}
