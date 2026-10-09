import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { useSaveExitForm } from "@/hooks/useInscriptionProgression";
import {
  CECRL_LEVELS,
  OBJECTIF_ATTEINT_LABELS,
  OBJECTIF_ATTEINT_VALUES,
  type ObjectifAtteint,
  type ProgressionEntryFields,
} from "@/lib/certificate-progression";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import {
  emptyFormulaireSortie,
  FORMATION_TYPE_LABELS,
  FORMATION_TYPE_VALUES,
  parseFormulaireSortie,
  type FormationTypeFormateur,
  type FormulaireSortieFormateur,
} from "@/lib/formateur-formation-forms";

interface FormateurExitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId: string;
  durationHours?: number | null;
  hoursFollowed?: number | null;
  initialFormulaire?: unknown;
  existingEntry?: ProgressionEntryFields | null;
}

function LevelSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          {CECRL_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {level}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FormateurExitFormDialog({
  open,
  onOpenChange,
  inscriptionId,
  durationHours,
  hoursFollowed,
  initialFormulaire,
  existingEntry,
}: FormateurExitFormDialogProps) {
  const save = useSaveExitForm();
  const { confirm, dialog: confirmDialog } = useConfirmAction();
  const [fields, setFields] = useState<FormulaireSortieFormateur>(
    emptyFormulaireSortie({ objectif_atteint: "oui" })
  );
  const [hours, setHours] = useState<number | "">(durationHours ?? "");

  useEffect(() => {
    if (!open) return;
    setFields(
      parseFormulaireSortie(initialFormulaire) ||
        emptyFormulaireSortie({ objectif_atteint: "oui" })
    );
    setHours(hoursFollowed ?? durationHours ?? "");
  }, [open, initialFormulaire, hoursFollowed, durationHours]);

  const set = <K extends keyof FormulaireSortieFormateur>(
    key: K,
    value: FormulaireSortieFormateur[K]
  ) => setFields((f) => ({ ...f, [key]: value }));

  const persistExit = async () => {
    await save.mutateAsync({
      inscriptionId,
      formulaire: fields,
      hoursFollowed: hours === "" ? null : Number(hours),
      existingEntry: existingEntry || undefined,
    });
    onOpenChange(false);
  };

  const handleSave = () => {
    confirm({
      title: "Enregistrer le formulaire de sortie ?",
      description:
        "Les niveaux de sortie formateur seront enregistrés pour cette inscription.",
      actionLabel: "Enregistrer",
      run: () => persistExit(),
    });
  };

  const isCollective = fields.type_formation === "collective";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formulaire de sortie formateur</DialogTitle>
          <DialogDescription>
            Aligné sur le formulaire Google de fin de formation. Obligatoire
            avant certificat. Les évaluations SNMSF / DSF ne sont jamais
            reprises ici.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Type de formation</Label>
            <Select
              value={fields.type_formation}
              onValueChange={(v) =>
                set("type_formation", v as FormationTypeFormateur)
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

          {isCollective && (
            <>
              <LevelSelect
                id="niveau_general_groupe"
                label="Niveau général du groupe"
                value={fields.niveau_general_groupe}
                onChange={(v) => set("niveau_general_groupe", v)}
              />
              <div className="space-y-2">
                <Label htmlFor="hetero">Remarques hétérogénéité</Label>
                <Textarea
                  id="hetero"
                  rows={2}
                  value={fields.remarques_heterogeneite || ""}
                  onChange={(e) =>
                    set("remarques_heterogeneite", e.target.value)
                  }
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LevelSelect
              id="niveau_general"
              label="Niveau général (sortie)"
              value={fields.niveau_general}
              onChange={(v) => set("niveau_general", v)}
            />
            <LevelSelect
              id="niveau_specifique"
              label="Niveau spécifique / technique"
              value={fields.niveau_specifique}
              onChange={(v) => set("niveau_specifique", v)}
            />
            <LevelSelect
              id="ce"
              label="Compréhension écrite (optionnel)"
              value={fields.comprehension_ecrite}
              onChange={(v) => set("comprehension_ecrite", v)}
            />
            <LevelSelect
              id="eo"
              label="Expression orale (optionnel)"
              value={fields.expression_orale}
              onChange={(v) => set("expression_orale", v)}
            />
            <LevelSelect
              id="gram"
              label="Grammaire (optionnel)"
              value={fields.connaissances_grammaticales}
              onChange={(v) => set("connaissances_grammaticales", v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Objectif pédagogique atteint</Label>
            <Select
              value={fields.objectif_atteint || "oui"}
              onValueChange={(v) =>
                set("objectif_atteint", v as ObjectifAtteint)
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

          {fields.objectif_atteint !== "oui" && (
            <div className="space-y-2">
              <Label htmlFor="ecarts">Si non / partiel — préciser</Label>
              <Textarea
                id="ecarts"
                rows={2}
                value={fields.objectif_ecart_detail || ""}
                onChange={(e) => set("objectif_ecart_detail", e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assiduite">
              Assiduité, comportement et investissement
            </Label>
            <Textarea
              id="assiduite"
              rows={3}
              value={fields.commentaire_assiduite || ""}
              onChange={(e) => set("commentaire_assiduite", e.target.value)}
              placeholder="Bilan sur l'investissement du stagiaire"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logistique">
              Moyens techniques et logistiques
            </Label>
            <Textarea
              id="logistique"
              rows={2}
              value={fields.commentaire_logistique || ""}
              onChange={(e) => set("commentaire_logistique", e.target.value)}
            />
          </div>

          {isCollective && (
            <div className="space-y-2">
              <Label htmlFor="dynamique">Dynamique de groupe</Label>
              <Textarea
                id="dynamique"
                rows={2}
                value={fields.commentaire_dynamique_groupe || ""}
                onChange={(e) =>
                  set("commentaire_dynamique_groupe", e.target.value)
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hours_followed">
              Heures suivies
              {durationHours != null ? ` (prévues : ${durationHours}h)` : ""}
            </Label>
            <Input
              id="hours_followed"
              type="number"
              min={0}
              value={hours}
              onChange={(e) =>
                setHours(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
