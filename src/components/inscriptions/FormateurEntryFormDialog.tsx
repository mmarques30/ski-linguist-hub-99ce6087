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
import { useSaveEntryForm } from "@/hooks/useInscriptionProgression";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import type { ProgressionEntryFields } from "@/lib/certificate-progression";
import {
  emptyFormulaireEntree,
  isFormulaireEntreeComplete,
  resolveFormulaireEntree,
  type FormateurFormationContext,
  type FormulaireEntreeFormateur,
} from "@/lib/formateur-formation-forms";
import { FormateurEntryFormFields } from "@/components/formateur/FormateurEntryFormFields";
import { FormateurFormationContextCard } from "@/components/formateur/FormateurFormationContextCard";

interface FormateurEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscriptionId: string;
  suggestedGeneralEntry?: string | null;
  initialFormulaire?: unknown;
  /** Colonnes plates pré-JSONB — repli si formulaire_entree est null. */
  legacyFlat?: ProgressionEntryFields | null;
  context?: FormateurFormationContext;
}

export function FormateurEntryFormDialog({
  open,
  onOpenChange,
  inscriptionId,
  suggestedGeneralEntry,
  initialFormulaire,
  legacyFlat,
  context,
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
    const resolved = resolveFormulaireEntree(initialFormulaire, legacyFlat);
    if (context?.formateurName && !resolved.formateur_nom) {
      resolved.formateur_nom = context.formateurName;
    }
    setFields(resolved);
  }, [open, initialFormulaire, legacyFlat, context?.formateurName]);

  const set = <K extends keyof FormulaireEntreeFormateur>(
    key: K,
    value: FormulaireEntreeFormateur[K]
  ) => setFields((f) => ({ ...f, [key]: value }));

  const persistEntry = async () => {
    await save.mutateAsync({ inscriptionId, formulaire: fields });
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!isFormulaireEntreeComplete(fields)) {
      toast.error(
        "Formulaire incomplet : 5 compétences (CECRL ou « Non évaluée »), attentes / compétences / thèmes, et moyens. Au moins une compétence orale et une technique doivent être évaluées."
      );
      return;
    }
    confirm({
      title: "Enregistrer le formulaire d'entrée ?",
      description:
        "Les compétences CECRL et remarques d'entrée seront enregistrées pour cette inscription.",
      actionLabel: "Enregistrer",
      run: () => persistEntry(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formulaire d&apos;entrée formateur</DialogTitle>
          <DialogDescription>
            Constat de début de formation (ex-Google Form) : type, compétences
            CECRL, attentes et moyens. La synthèse certificat (expression orale
            → général, grammaire → technique) est calculée à l&apos;enregistrement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {context ? <FormateurFormationContextCard context={context} /> : null}
          <FormateurEntryFormFields
            fields={fields}
            onChange={set}
            suggestedGeneralEntry={suggestedGeneralEntry}
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
