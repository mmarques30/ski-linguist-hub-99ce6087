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

/**
 * Champs alignés sur le Google Form « Formulaire de fin de formation ».
 * Amélioration app : 1 dossier = 1 stagiaire (plus de grille 12 lignes).
 */
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
    <div className="space-y-5">
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
        <div className="space-y-4 rounded-[var(--radius)] border border-border p-3">
          <div>
            <p className="text-sm font-medium">
              Niveau général du groupe en fin de formation
            </p>
            <p className="text-xs text-muted-foreground">
              Puis le niveau de ce stagiaire (un bilan par dossier — remplace la
              grille Google à 12 lignes).
            </p>
          </div>
          <FormateurCecrlLevelSelect
            id="niveau_general_groupe"
            label="Niveau général du groupe"
            value={fields.niveau_general_groupe}
            onChange={(v) => onChange("niveau_general_groupe", v)}
            mode="cecrl"
            required
          />
          <div className="space-y-2">
            <Label htmlFor="hetero">
              Remarques si hétérogénéité dans l&apos;évolution des stagiaires
            </Label>
            <Textarea
              id="hetero"
              rows={2}
              value={fields.remarques_heterogeneite || ""}
              onChange={(e) =>
                onChange("remarques_heterogeneite", e.target.value)
              }
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">
            Niveau du stagiaire en fin de formation
          </p>
          <p className="text-xs text-muted-foreground">
            Synthèse certificat. « Non évaluée » possible, mais au moins un
            niveau général et un niveau spécifique CECRL sont requis.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormateurCecrlLevelSelect
            id="niveau_general"
            label="Niveau général"
            value={fields.niveau_general}
            onChange={(v) => onChange("niveau_general", v)}
            required
          />
          <FormateurCecrlLevelSelect
            id="niveau_specifique"
            label="Niveau spécifique"
            value={fields.niveau_specifique}
            onChange={(v) => onChange("niveau_specifique", v)}
            required
          />
        </div>
      </div>

      {isCollective ? (
        <div className="space-y-4 rounded-[var(--radius)] border border-border p-3">
          <p className="text-sm font-medium">
            Appréciation générale (cours collectifs)
          </p>
          <div className="space-y-2">
            <Label htmlFor="dynamique">
              Niveau général, assiduité, ponctualité, cohésion et dynamique de
              groupe <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="dynamique"
              rows={3}
              value={fields.commentaire_dynamique_groupe || ""}
              onChange={(e) =>
                onChange("commentaire_dynamique_groupe", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="liste">
              Liste des stagiaires du groupe (prénoms, noms, numéro)
            </Label>
            <Textarea
              id="liste"
              rows={3}
              value={fields.stagiaires_liste || ""}
              onChange={(e) => onChange("stagiaires_liste", e.target.value)}
              placeholder="1. … — 2. … (optionnel : déjà un bilan par dossier)"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Appréciation générale (cours individuels)
          </p>
          <Label htmlFor="assiduite">
            Commentaires concernant l&apos;assiduité, le comportement et
            l&apos;investissement du stagiaire{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="assiduite"
            rows={3}
            value={fields.commentaire_assiduite || ""}
            onChange={(e) => onChange("commentaire_assiduite", e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>
          {isCollective
            ? "Les stagiaires ont-ils atteint les objectifs pédagogiques fixés en début de formation ?"
            : "L'objectif pédagogique a-t-il été atteint ?"}{" "}
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
        <p className="text-2xs text-muted-foreground">
          Google Form : Oui / Non — l&apos;option « Partiellement » est un
          ajout app.
        </p>
      </div>

      {fields.objectif_atteint && fields.objectif_atteint !== "oui" ? (
        <div className="space-y-2">
          <Label htmlFor="ecarts">
            {isCollective
              ? "Si non : raisons et explications des écarts (par stagiaire concerné)"
              : "Si non : préciser les raisons"}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="ecarts"
            rows={3}
            value={fields.objectif_ecart_detail || ""}
            onChange={(e) => onChange("objectif_ecart_detail", e.target.value)}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="logistique">
          Commentaires concernant les moyens techniques et logistiques (salle,
          horaires, matériel, etc.)
          {!isCollective ? (
            <span className="text-destructive"> *</span>
          ) : null}
        </Label>
        <Textarea
          id="logistique"
          rows={2}
          value={fields.commentaire_logistique || ""}
          onChange={(e) => onChange("commentaire_logistique", e.target.value)}
        />
      </div>

      {!isCollective ? null : (
        <div className="space-y-2">
          <Label htmlFor="assiduite_col">
            Notes d&apos;assiduité / investissement (ce stagiaire)
          </Label>
          <Textarea
            id="assiduite_col"
            rows={2}
            value={fields.commentaire_assiduite || ""}
            onChange={(e) => onChange("commentaire_assiduite", e.target.value)}
            placeholder="Optionnel — en plus de l'appréciation de groupe"
          />
        </div>
      )}

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
