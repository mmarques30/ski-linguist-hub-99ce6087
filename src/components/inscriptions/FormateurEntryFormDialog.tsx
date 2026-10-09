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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useSaveEntryForm } from "@/hooks/useInscriptionProgression";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { CECRL_LEVELS } from "@/lib/certificate-progression";
import {
  emptyFormulaireEntree,
  FORMATION_TYPE_LABELS,
  FORMATION_TYPE_VALUES,
  parseFormulaireEntree,
  type FormationTypeFormateur,
  type FormulaireEntreeFormateur,
} from "@/lib/formateur-formation-forms";

interface FormateurEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId: string;
  suggestedGeneralEntry?: string | null;
  initialFormulaire?: unknown;
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

export function FormateurEntryFormDialog({
  open,
  onOpenChange,
  inscriptionId,
  suggestedGeneralEntry,
  initialFormulaire,
}: FormateurEntryFormDialogProps) {
  const save = useSaveEntryForm();
  const { confirm, dialog: confirmDialog } = useConfirmAction();
  const [fields, setFields] = useState<FormulaireEntreeFormateur>(
    emptyFormulaireEntree()
  );

  useEffect(() => {
    if (!open) return;
    // Jamais de préremplissage depuis le test de placement : le niveau d'entrée
    // est un constat formateur en début de formation.
    setFields(
      parseFormulaireEntree(initialFormulaire) || emptyFormulaireEntree()
    );
  }, [open, initialFormulaire]);

  const set = <K extends keyof FormulaireEntreeFormateur>(
    key: K,
    value: FormulaireEntreeFormateur[K]
  ) => setFields((f) => ({ ...f, [key]: value }));

  const persistEntry = async () => {
    await save.mutateAsync({ inscriptionId, formulaire: fields });
    onOpenChange(false);
  };

  const handleSave = () => {
    confirm({
      title: "Enregistrer le formulaire d'entrée ?",
      description:
        "Les compétences CECRL et remarques d'entrée seront enregistrées pour cette inscription.",
      actionLabel: "Enregistrer",
      run: () => persistEntry(),
    });
  };

  const isCollective = fields.type_formation === "collective";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formulaire d&apos;entrée formateur</DialogTitle>
          <DialogDescription>
            Aligné sur le formulaire Google de début de formation : type,
            compétences CECRL, attentes et moyens. La synthèse certificat
            (expression orale → général, grammaire → technique) est calculée à
            l&apos;enregistrement.
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
                <Label htmlFor="remarques_groupe">Remarques sur le groupe</Label>
                <Textarea
                  id="remarques_groupe"
                  rows={2}
                  value={fields.remarques_groupe || ""}
                  onChange={(e) => set("remarques_groupe", e.target.value)}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LevelSelect
              id="ce"
              label="Compréhension écrite"
              value={fields.comprehension_ecrite}
              onChange={(v) => set("comprehension_ecrite", v)}
            />
            <LevelSelect
              id="co"
              label="Compréhension orale"
              value={fields.comprehension_orale}
              onChange={(v) => set("comprehension_orale", v)}
            />
            <LevelSelect
              id="ee"
              label="Expression écrite"
              value={fields.expression_ecrite}
              onChange={(v) => set("expression_ecrite", v)}
            />
            <LevelSelect
              id="eo"
              label="Expression orale"
              value={fields.expression_orale}
              onChange={(v) => set("expression_orale", v)}
            />
            <LevelSelect
              id="gram"
              label="Connaissances grammaticales"
              value={fields.connaissances_grammaticales}
              onChange={(v) => set("connaissances_grammaticales", v)}
            />
          </div>

          {suggestedGeneralEntry && (
            <p className="text-xs text-muted-foreground">
              Indicatif test (ne pas recopier tel quel) : {suggestedGeneralEntry}
            </p>
          )}

          {!isCollective ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="attentes">Attentes du stagiaire</Label>
                <Textarea
                  id="attentes"
                  rows={2}
                  value={fields.attentes_stagiaire || ""}
                  onChange={(e) => set("attentes_stagiaire", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competences">Compétences à développer</Label>
                <Textarea
                  id="competences"
                  rows={2}
                  value={fields.competences_a_developper || ""}
                  onChange={(e) =>
                    set("competences_a_developper", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themes">Thèmes à travailler</Label>
                <Textarea
                  id="themes"
                  rows={2}
                  value={fields.themes_a_travailler || ""}
                  onChange={(e) => set("themes_a_travailler", e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="attentes_g">Attentes du groupe</Label>
                <Textarea
                  id="attentes_g"
                  rows={2}
                  value={fields.attentes_groupe || ""}
                  onChange={(e) => set("attentes_groupe", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competences_g">Compétences à développer</Label>
                <Textarea
                  id="competences_g"
                  rows={2}
                  value={fields.competences_groupe || ""}
                  onChange={(e) => set("competences_groupe", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themes_g">Thèmes à travailler</Label>
                <Textarea
                  id="themes_g"
                  rows={2}
                  value={fields.themes_groupe || ""}
                  onChange={(e) => set("themes_groupe", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="absents">Absents aujourd&apos;hui</Label>
                <Textarea
                  id="absents"
                  rows={2}
                  value={fields.absents || ""}
                  onChange={(e) => set("absents", e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="moyens">
              Adéquation des moyens (salle, matériel, connexion…)
            </Label>
            <Textarea
              id="moyens"
              rows={2}
              value={fields.adequation_moyens || ""}
              onChange={(e) => set("adequation_moyens", e.target.value)}
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
