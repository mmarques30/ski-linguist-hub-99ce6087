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
import { Loader2 } from "lucide-react";
import { useSaveEntryForm } from "@/hooks/useInscriptionProgression";
import type { ProgressionEntryFields } from "@/lib/certificate-progression";

interface FormateurEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId: string;
  suggestedGeneralEntry?: string | null;
  initial?: ProgressionEntryFields | null;
}

export function FormateurEntryFormDialog({
  open,
  onOpenChange,
  inscriptionId,
  suggestedGeneralEntry,
  initial,
}: FormateurEntryFormDialogProps) {
  const save = useSaveEntryForm();
  const [fields, setFields] = useState<ProgressionEntryFields>({
    niveau_general_entree: "",
    niveau_technique_entree: "",
    remarques_entree: "",
  });

  useEffect(() => {
    if (!open) return;
    setFields({
      niveau_general_entree:
        initial?.niveau_general_entree || suggestedGeneralEntry || "",
      niveau_technique_entree: initial?.niveau_technique_entree || "",
      remarques_entree: initial?.remarques_entree || "",
    });
  }, [open, initial, suggestedGeneralEntry]);

  const handleSave = async () => {
    await save.mutateAsync({ inscriptionId, fields });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Formulaire d&apos;entrée formateur</DialogTitle>
          <DialogDescription>
            Niveau général = piste du test de placement, ou constat au premier
            cours s&apos;il n&apos;y a pas de placement. Niveau technique =
            observation métier au premier cours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="niveau_general_entree">Niveau général (entrée)</Label>
            <Input
              id="niveau_general_entree"
              value={fields.niveau_general_entree || ""}
              onChange={(e) =>
                setFields((f) => ({ ...f, niveau_general_entree: e.target.value }))
              }
              placeholder="Ex. Piste bleue"
            />
            {suggestedGeneralEntry && (
              <p className="text-xs text-muted-foreground">
                Suggestion placement : {suggestedGeneralEntry}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="niveau_technique_entree">
              Niveau technique / métier (entrée)
            </Label>
            <Input
              id="niveau_technique_entree"
              value={fields.niveau_technique_entree || ""}
              onChange={(e) =>
                setFields((f) => ({
                  ...f,
                  niveau_technique_entree: e.target.value,
                }))
              }
              placeholder="Observation au premier cours"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remarques_entree">Remarques</Label>
            <Textarea
              id="remarques_entree"
              rows={3}
              value={fields.remarques_entree || ""}
              onChange={(e) =>
                setFields((f) => ({ ...f, remarques_entree: e.target.value }))
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
