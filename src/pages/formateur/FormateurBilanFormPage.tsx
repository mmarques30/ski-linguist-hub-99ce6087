import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, FileInput, FileOutput, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { FormateurEntryFormFields } from "@/components/formateur/FormateurEntryFormFields";
import { FormateurExitFormFields } from "@/components/formateur/FormateurExitFormFields";
import { FormateurFormationContextCard } from "@/components/formateur/FormateurFormationContextCard";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  useInscriptionProgression,
  useSaveEntryForm,
  useSaveExitForm,
} from "@/hooks/useInscriptionProgression";
import {
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import {
  emptyFormulaireEntree,
  emptyFormulaireSortie,
  isFormulaireEntreeComplete,
  isFormulaireSortieComplete,
  resolveFormulaireEntree,
  resolveFormulaireSortie,
  type FormulaireEntreeFormateur,
  type FormulaireSortieFormateur,
} from "@/lib/formateur-formation-forms";
import { PageHeader, PageShell, SurfaceCard, TableSkeleton } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

type Kind = "entree" | "sortie";

export default function FormateurBilanFormPage({ kind }: { kind: Kind }) {
  const { inscriptionId = "" } = useParams<{ inscriptionId: string }>();
  const navigate = useNavigate();
  const { basePath, isAssistMode } = useFormateurView();
  const { data: profile } = useFormateurProfile();
  const { data: inscriptions = [], isLoading: loadingList } =
    useFormateurInscriptions(profile?.id);
  const { data: progression, isLoading: loadingProg } =
    useInscriptionProgression(inscriptionId);
  const saveEntry = useSaveEntryForm();
  const saveExit = useSaveExitForm();

  const row = useMemo(
    () => inscriptions.find((i) => i.id === inscriptionId) ?? null,
    [inscriptions, inscriptionId]
  );

  const formateurName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : null;

  const context = useMemo(
    () => ({
      studentName: row?.student_name,
      inscriptionCode: row?.code,
      language: row?.language,
      location: row?.course_location,
      startDate: row?.start_date,
      endDate: row?.end_date,
      modality: row?.modality,
      formateurName,
      durationHours: row?.duration_hours ?? progression?.duration_hours,
    }),
    [row, formateurName, progression?.duration_hours]
  );

  const [entryFields, setEntryFields] = useState<FormulaireEntreeFormateur>(
    emptyFormulaireEntree()
  );
  const [exitFields, setExitFields] = useState<FormulaireSortieFormateur>(
    emptyFormulaireSortie({ objectif_atteint: "oui" })
  );
  const [hours, setHours] = useState<number | "">("");

  useEffect(() => {
    if (!progression && loadingProg) return;
    if (kind === "entree") {
      const resolved = resolveFormulaireEntree(
        progression?.formulaire_entree,
        progression
          ? {
              niveau_general_entree: progression.niveau_general_entree,
              niveau_technique_entree: progression.niveau_technique_entree,
              remarques_entree: progression.remarques_entree,
            }
          : null
      );
      if (formateurName && !resolved.formateur_nom) {
        resolved.formateur_nom = formateurName;
      }
      setEntryFields(resolved);
    } else {
      const resolved = resolveFormulaireSortie(
        progression?.formulaire_sortie,
        progression
          ? {
              niveau_general_sortie: progression.niveau_general_sortie,
              niveau_technique_sortie: progression.niveau_technique_sortie,
              objectif_atteint: progression.objectif_atteint,
              commentaire_sortie: progression.commentaire_sortie,
            }
          : null
      );
      if (formateurName && !resolved.formateur_nom) {
        resolved.formateur_nom = formateurName;
      }
      setExitFields(resolved);
      setHours(
        progression?.hours_followed ??
          progression?.duration_hours ??
          row?.duration_hours ??
          ""
      );
    }
  }, [kind, progression, loadingProg, formateurName, row?.duration_hours]);

  const setEntry = <K extends keyof FormulaireEntreeFormateur>(
    key: K,
    value: FormulaireEntreeFormateur[K]
  ) => setEntryFields((f) => ({ ...f, [key]: value }));

  const setExit = <K extends keyof FormulaireSortieFormateur>(
    key: K,
    value: FormulaireSortieFormateur[K]
  ) => setExitFields((f) => ({ ...f, [key]: value }));

  const pending = saveEntry.isPending || saveExit.isPending;
  const loading = loadingList || loadingProg;

  const handleSave = async () => {
    if (isAssistMode) {
      toast.message("Mode Assister : enregistrement désactivé (aperçu).");
      return;
    }
    if (kind === "entree") {
      if (!isFormulaireEntreeComplete(entryFields)) {
        toast.error(
          "Formulaire incomplet : compétences, attentes / thèmes, et moyens."
        );
        return;
      }
      await saveEntry.mutateAsync({
        inscriptionId,
        formulaire: entryFields,
      });
    } else {
      if (!isFormulaireSortieComplete(exitFields)) {
        toast.error(
          "Formulaire incomplet : niveaux, objectif, et assiduité/logistique ou dynamique de groupe."
        );
        return;
      }
      await saveExit.mutateAsync({
        inscriptionId,
        formulaire: exitFields,
        hoursFollowed: hours === "" ? null : Number(hours),
        existingEntry: progression
          ? {
              niveau_general_entree: progression.niveau_general_entree,
              niveau_technique_entree: progression.niveau_technique_entree,
              remarques_entree: progression.remarques_entree,
            }
          : undefined,
      });
    }
    navigate(`${basePath}/bilans`);
  };

  const title =
    kind === "entree"
      ? "Formulaire d'entrée en formation"
      : "Formulaire de fin de formation";
  const Icon = kind === "entree" ? FileInput : FileOutput;

  return (
    <FormateurPageShell>
      <PageShell width="narrow">
        <PageHeader
          title={title}
          description={
            kind === "entree"
              ? "Constat de début — niveaux CECRL, attentes et moyens"
              : "Bilan de fin — synthèse certificat et commentaires"
          }
          icon={Icon}
          tone="gold"
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/bilans`}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Bilans
              </Link>
            </Button>
          }
        />

        {loading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={6} cols={2} />
          </SurfaceCard>
        ) : !row ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">
              Mission introuvable ou hors de ton périmètre.
            </p>
            <Button className="mt-3" variant="outline" asChild>
              <Link to={`${basePath}/bilans`}>Retour aux bilans</Link>
            </Button>
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <FormateurFormationContextCard context={context} />
            <SurfaceCard>
              {kind === "entree" ? (
                <FormateurEntryFormFields
                  fields={entryFields}
                  onChange={setEntry}
                />
              ) : (
                <FormateurExitFormFields
                  fields={exitFields}
                  onChange={setExit}
                  hours={hours}
                  onHoursChange={setHours}
                  durationHours={
                    progression?.duration_hours ?? row.duration_hours
                  }
                />
              )}
            </SurfaceCard>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" asChild>
                <Link to={`${basePath}/bilans`}>Annuler</Link>
              </Button>
              <Button onClick={handleSave} disabled={pending || isAssistMode}>
                {pending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </PageShell>
    </FormateurPageShell>
  );
}
