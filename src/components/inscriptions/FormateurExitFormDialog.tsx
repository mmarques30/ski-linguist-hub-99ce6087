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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSaveExitForm } from "@/hooks/useInscriptionProgression";
import {
  type ProgressionEntryFields,
  type ProgressionExitFields,
} from "@/lib/certificate-progression";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import {
  emptyFormulaireSortie,
  isFormulaireSortieComplete,
  resolveFormulaireSortie,
  type FormateurFormationContext,
  type FormulaireSortieFormateur,
} from "@/lib/formateur-formation-forms";
import { FormateurExitFormFields } from "@/components/formateur/FormateurExitFormFields";
import { FormateurFormationContextCard } from "@/components/formateur/FormateurFormationContextCard";

interface FormateurExitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId: string;
  durationHours?: number | null;
  hoursFollowed?: number | null;
  initialFormulaire?: unknown;
  existingEntry?: ProgressionEntryFields | null;
  /** Colonnes plates pré-JSONB — repli si formulaire_sortie est null. */
  legacyFlat?: ProgressionExitFields | null;
  context?: FormateurFormationContext;
}

export function FormateurExitFormDialog({
  open,
  onOpenChange,
  inscriptionId,
  durationHours,
  hoursFollowed,
  initialFormulaire,
  existingEntry,
  legacyFlat,
  context,
}: FormateurExitFormDialogProps) {
  const save = useSaveExitForm();
  const { confirm, dialog: confirmDialog } = useConfirmAction();
  const [fields, setFields] = useState<FormulaireSortieFormateur>(
    emptyFormulaireSortie({ objectif_atteint: "oui" })
  );
  const [hours, setHours] = useState<number | "">(durationHours ?? "");

  useEffect(() => {
    if (!open) return;
    const resolved = resolveFormulaireSortie(initialFormulaire, legacyFlat);
    if (context?.formateurName && !resolved.formateur_nom) {
      resolved.formateur_nom = context.formateurName;
    }
    setFields(resolved);
    setHours(hoursFollowed ?? durationHours ?? "");
  }, [
    open,
    initialFormulaire,
    legacyFlat,
    hoursFollowed,
    durationHours,
    context?.formateurName,
  ]);

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
    if (!isFormulaireSortieComplete(fields)) {
      toast.error(
        "Formulaire incomplet : niveaux général et spécifique, objectif, et selon le type — assiduité + logistique (individuel) ou dynamique de groupe (collectif)."
      );
      return;
    }
    confirm({
      title: "Enregistrer le formulaire de sortie ?",
      description:
        "Les niveaux de sortie formateur seront enregistrés pour cette inscription.",
      actionLabel: "Enregistrer",
      run: () => persistExit(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formulaire de sortie formateur</DialogTitle>
          <DialogDescription>
            Aligné sur le Google Form de fin de formation (individuel /
            collectif). Obligatoire avant certificat — jamais SNMSF / DSF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {context ? <FormateurFormationContextCard context={context} /> : null}
          <FormateurExitFormFields
            fields={fields}
            onChange={set}
            hours={hours}
            onHoursChange={setHours}
            durationHours={durationHours}
          />
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
