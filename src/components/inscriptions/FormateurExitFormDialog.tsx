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
  type ProgressionExitFields,
} from "@/lib/certificate-progression";

interface FormateurExitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId: string;
  durationHours?: number | null;
  hoursFollowed?: number | null;
  initial?: ProgressionExitFields | null;
  existingEntry?: ProgressionEntryFields | null;
}

export function FormateurExitFormDialog({
  open,
  onOpenChange,
  inscriptionId,
  durationHours,
  hoursFollowed,
  initial,
  existingEntry,
}: FormateurExitFormDialogProps) {
  const save = useSaveExitForm();
  const [fields, setFields] = useState<ProgressionExitFields>({
    niveau_general_sortie: "B1",
    niveau_technique_sortie: "B1",
    objectif_atteint: "oui",
    commentaire_sortie: "",
  });
  const [hours, setHours] = useState<number | "">(durationHours ?? "");

  useEffect(() => {
    if (!open) return;
    setFields({
      niveau_general_sortie: initial?.niveau_general_sortie || "B1",
      niveau_technique_sortie: initial?.niveau_technique_sortie || "B1",
      objectif_atteint: initial?.objectif_atteint || "oui",
      commentaire_sortie: initial?.commentaire_sortie || "",
    });
    setHours(hoursFollowed ?? durationHours ?? "");
  }, [open, initial, hoursFollowed, durationHours]);

  const handleSave = async () => {
    await save.mutateAsync({
      inscriptionId,
      fields,
      hoursFollowed: hours === "" ? null : Number(hours),
      existingEntry: existingEntry || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Formulaire de sortie formateur</DialogTitle>
          <DialogDescription>
            Quatre champs : niveaux CECRL de sortie (général + technique),
            objectif atteint, commentaire. Obligatoire avant certificat. Les
            évaluations SNMSF / DSF ne sont jamais reprises ici.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Niveau général (sortie CECRL)</Label>
              <Select
                value={fields.niveau_general_sortie || "B1"}
                onValueChange={(v) =>
                  setFields((f) => ({ ...f, niveau_general_sortie: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-2">
              <Label>Niveau technique (sortie CECRL)</Label>
              <Select
                value={fields.niveau_technique_sortie || "B1"}
                onValueChange={(v) =>
                  setFields((f) => ({ ...f, niveau_technique_sortie: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
          </div>

          <div className="space-y-2">
            <Label>Objectif pédagogique atteint</Label>
            <Select
              value={fields.objectif_atteint || "oui"}
              onValueChange={(v) =>
                setFields((f) => ({
                  ...f,
                  objectif_atteint: v as ObjectifAtteint,
                }))
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

          <div className="space-y-2">
            <Label htmlFor="commentaire_sortie">
              Commentaire formateur (2–3 lignes)
            </Label>
            <Textarea
              id="commentaire_sortie"
              rows={3}
              value={fields.commentaire_sortie || ""}
              onChange={(e) =>
                setFields((f) => ({ ...f, commentaire_sortie: e.target.value }))
              }
              placeholder="Bilan libre sur la progression du stagiaire"
            />
          </div>

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
    </Dialog>
  );
}
