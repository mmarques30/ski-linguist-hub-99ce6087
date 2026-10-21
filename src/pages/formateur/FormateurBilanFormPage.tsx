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
import { useSyncCohortNiveaux } from "@/hooks/useSyncCohortNiveaux";
import {
  useFormateurInscriptions,
  useFormateurProfile,
} from "@/hooks/useFormateurPortal";
import {
  applyStagiaireNiveauToEntryForm,
  applyStagiaireNiveauToExitForm,
  emptyFormulaireEntree,
  emptyFormulaireSortie,
  isFormulaireEntreeComplete,
  isFormulaireSortieComplete,
  resolveFormulaireEntree,
  resolveFormulaireSortie,
  type FormulaireEntreeFormateur,
  type FormulaireSortieFormateur,
} from "@/lib/formateur-formation-forms";
import {
  buildNiveauxFromCohort,
  cohortInscriptionsFor,
} from "@/lib/formateur-stagiaire-niveaux";
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
  const syncCohort = useSyncCohortNiveaux();

  const row = useMemo(
    () => inscriptions.find((i) => i.id === inscriptionId) ?? null,
    [inscriptions, inscriptionId]
  );

  const cohort = useMemo(
    () => (row ? cohortInscriptionsFor(row, inscriptions) : []),
    [row, inscriptions]
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
      let resolved = resolveFormulaireEntree(
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
      if (resolved.type_formation === "collective" && cohort.length > 0) {
        resolved = {
          ...resolved,
          stagiaires_niveaux: buildNiveauxFromCohort(
            cohort,
            "entree",
            resolved.stagiaires_niveaux
          ),
        };
      }
      setEntryFields(resolved);
    } else {
      let resolved = resolveFormulaireSortie(
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
      if (resolved.type_formation === "collective" && cohort.length > 0) {
        resolved = {
          ...resolved,
          stagiaires_niveaux: buildNiveauxFromCohort(
            cohort,
            "sortie",
            resolved.stagiaires_niveaux
          ),
        };
      }
      setExitFields(resolved);
      setHours(
        progression?.hours_followed ??
          progression?.duration_hours ??
          row?.duration_hours ??
          ""
      );
    }
  }, [
    kind,
    progression,
    loadingProg,
    formateurName,
    row?.duration_hours,
    cohort,
  ]);

  const setEntry = <K extends keyof FormulaireEntreeFormateur>(
    key: K,
    value: FormulaireEntreeFormateur[K]
  ) => {
    setEntryFields((f) => {
      const next = { ...f, [key]: value };
      if (key === "type_formation" && value === "collective" && cohort.length) {
        next.stagiaires_niveaux = buildNiveauxFromCohort(
          cohort,
          "entree",
          f.stagiaires_niveaux
        );
      }
      if (key === "type_formation" && value === "individuelle") {
        next.stagiaires_niveaux = null;
      }
      return next;
    });
  };

  const setExit = <K extends keyof FormulaireSortieFormateur>(
    key: K,
    value: FormulaireSortieFormateur[K]
  ) => {
    setExitFields((f) => {
      const next = { ...f, [key]: value };
      if (key === "type_formation" && value === "collective" && cohort.length) {
        next.stagiaires_niveaux = buildNiveauxFromCohort(
          cohort,
          "sortie",
          f.stagiaires_niveaux
        );
      }
      if (key === "type_formation" && value === "individuelle") {
        next.stagiaires_niveaux = null;
      }
      return next;
    });
  };

  const pending =
    saveEntry.isPending || saveExit.isPending || syncCohort.isPending;
  const loading = loadingList || loadingProg;

  const handleSave = async () => {
    if (isAssistMode) {
      toast.message("Mode Assister : enregistrement désactivé (aperçu).");
      return;
    }
    if (kind === "entree") {
      let formulaire = entryFields;
      if (formulaire.type_formation === "collective") {
        formulaire = applyStagiaireNiveauToEntryForm(formulaire, inscriptionId);
      }
      if (!isFormulaireEntreeComplete(formulaire)) {
        toast.error(
          formulaire.type_formation === "collective"
            ? "Indique un niveau général et technique pour chaque stagiaire, plus les champs groupe."
            : "Formulaire incomplet : compétences, attentes / thèmes, et moyens."
        );
        return;
      }
      await saveEntry.mutateAsync({ inscriptionId, formulaire });
      if (
        formulaire.type_formation === "collective" &&
        (formulaire.stagiaires_niveaux?.length || 0) > 1
      ) {
        await syncCohort.mutateAsync({
          kind: "entree",
          currentInscriptionId: inscriptionId,
          niveaux: formulaire.stagiaires_niveaux || [],
          templateEntree: formulaire,
        });
        toast.success("Niveaux d'entrée enregistrés pour le groupe");
      }
    } else {
      let formulaire = exitFields;
      if (formulaire.type_formation === "collective") {
        formulaire = applyStagiaireNiveauToExitForm(formulaire, inscriptionId);
      }
      if (!isFormulaireSortieComplete(formulaire)) {
        toast.error(
          formulaire.type_formation === "collective"
            ? "Indique un niveau pour chaque stagiaire, la dynamique de groupe et l'objectif."
            : "Formulaire incomplet : niveaux, objectif, assiduité et logistique."
        );
        return;
      }
      await saveExit.mutateAsync({
        inscriptionId,
        formulaire,
        hoursFollowed: hours === "" ? null : Number(hours),
        existingEntry: progression
          ? {
              niveau_general_entree: progression.niveau_general_entree,
              niveau_technique_entree: progression.niveau_technique_entree,
              remarques_entree: progression.remarques_entree,
            }
          : undefined,
      });
      if (
        formulaire.type_formation === "collective" &&
        (formulaire.stagiaires_niveaux?.length || 0) > 1
      ) {
        await syncCohort.mutateAsync({
          kind: "sortie",
          currentInscriptionId: inscriptionId,
          niveaux: formulaire.stagiaires_niveaux || [],
          templateSortie: formulaire,
        });
        toast.success("Niveaux de sortie enregistrés pour le groupe");
      }
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
              ? "Un niveau par stagiaire en début de formation"
              : "Un niveau par stagiaire en fin de formation"
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
            {cohort.length > 1 ? (
              <p className="text-xs text-muted-foreground">
                Groupe détecté : {cohort.length} stagiaire
                {cohort.length > 1 ? "s" : ""} — en formation collective, tu
                renseignes le niveau de chacun.
              </p>
            ) : null}
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
