import { useMemo, useState } from "react";
import { useTabParam } from "@/hooks/useTabParam";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  History,
  Loader2,
  Mail,
  PlayCircle,
  Radio,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  PageShell,
  SegmentedControl,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  type PillTone,
} from "@/components/ui-kit";
import {
  canPublish,
  checkVariables,
  modelStatus,
  needsReview,
  renderPreview,
  type EmailModel,
  type EmailModelVariant,
} from "@/lib/email-models";
import {
  useEdgeDispatchLog,
  useEmailModels,
  usePublishEmailDraft,
  useRunEmailCronNow,
  useSaveEmailDraft,
  useSetEmailCronActive,
  useUnpublishEmailTemplate,
} from "@/hooks/useEmailModels";
import { EmailSendJournal } from "@/components/admin/EmailSendJournal";

const AUDIENCE_LABELS: Record<string, string> = {
  candidat: "Stagiaire",
  client: "Client / ESF",
  interne: "Interne FLI",
};

type DraftEdits = Record<string, Partial<EmailModelVariant>>;
type EmailsTab = "modeles" | "journal";
/** Onglets d'un texte : le français est la seule langue d'envoi aujourd'hui. */
type VariantTab = "fr" | "apercu";

function StatusBadge({ model }: { model: EmailModel }) {
  const status = modelStatus(model);
  if (status === "actif") {
    return (
      <StatusPill tone="success" icon={CheckCircle2} size="sm">
        Actif
      </StatusPill>
    );
  }
  if (status === "partiel") {
    return (
      <StatusPill tone="warning" icon={AlertTriangle} size="sm">
        Partiellement actif
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="neutral" icon={Clock} size="sm">
      Brouillon
    </StatusPill>
  );
}

function VariantEditor({
  variant,
  edits,
  onChange,
  onSave,
  onPublish,
  onUnpublish,
  busy,
}: {
  variant: EmailModelVariant;
  edits: Partial<EmailModelVariant>;
  onChange: (patch: Partial<EmailModelVariant>) => void;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  busy: boolean;
}) {
  const merged: EmailModelVariant = { ...variant, ...edits };
  const dirty = Object.keys(edits).length > 0;
  const variables = checkVariables(merged);
  const [variantTab, setVariantTab] = useState<VariantTab>("fr");

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{variant.variant_label || variant.slug}</p>
          <p className="font-mono text-xs text-muted-foreground">{variant.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {variant.is_active ? (
            <StatusPill tone="success" icon={CheckCircle2} size="sm">
              Texte actif
            </StatusPill>
          ) : (
            <StatusPill tone="neutral" size="sm">Jamais envoyé</StatusPill>
          )}
          {!variant.in_sync && (
            <StatusPill tone="warning" size="sm">À relire</StatusPill>
          )}
        </div>
      </div>

      {variant.notes && (
        <p className="text-xs text-muted-foreground">{variant.notes}</p>
      )}

      <SegmentedControl<VariantTab>
        value={variantTab}
        onChange={setVariantTab}
        size="sm"
        ariaLabel={`Texte et aperçu — ${variant.slug}`}
        options={[
          { value: "fr", label: "Texte", icon: FileText },
          { value: "apercu", label: "Aperçu", icon: Eye },
        ]}
      />

      {variantTab === "fr" && (
        <div className="space-y-2 pt-1">
          <Input
            value={merged.subject_fr}
            placeholder="Sujet"
            aria-label={`Sujet — ${variant.slug}`}
            onChange={(e) => onChange({ subject_fr: e.target.value })}
          />
          <Textarea
            value={merged.body_fr}
            placeholder="Corps HTML"
            rows={12}
            aria-label={`Corps HTML — ${variant.slug}`}
            className="font-mono text-xs"
            onChange={(e) => onChange({ body_fr: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Les emails transactionnels partent uniquement en français.
          </p>
        </div>
      )}

      {variantTab === "apercu" && (
        <div className="space-y-2 pt-1">
          <p className="text-sm">
            <span className="text-muted-foreground">Sujet : </span>
            {renderPreview(merged.subject_fr)}
          </p>
          <div
            className="prose prose-sm max-w-none rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-3 text-sm dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderPreview(merged.body_fr) }}
          />
          <p className="text-xs text-muted-foreground">
            Aperçu avec un jeu ZZTEST : aucune donnée réelle, aucune adresse délivrable.
          </p>
        </div>
      )}

      {/* Pastilles de variables déclarées. */}
      <div className="flex flex-wrap gap-2 text-xs">
        {merged.variables.map((name) => (
          <code
            key={name}
            className="rounded-pill bg-[hsl(var(--surface-sunken))] px-2 py-0.5 ring-1 ring-inset ring-border"
          >
            {`{{${name}}}`}
          </code>
        ))}
      </div>

      {variables.undeclared.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Variables non déclarées</AlertTitle>
          <AlertDescription>
            {variables.undeclared.join(", ")} — elles partiraient telles quelles dans le
            message.
          </AlertDescription>
        </Alert>
      )}
      {variables.unused.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Déclarées mais absentes du texte : {variables.unused.join(", ")}.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onSave} disabled={!dirty || busy}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer le brouillon
        </Button>
        <Button size="sm" onClick={onPublish} disabled={busy || !canPublish(merged) || dirty}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Valider et activer
        </Button>
        {variant.is_active && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onUnpublish}
            disabled={busy}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Désactiver
          </Button>
        )}
      </div>
      {dirty && (
        <p className="text-xs text-muted-foreground">
          Enregistrez le brouillon avant de l'activer : seul le texte enregistré est publié.
        </p>
      )}
    </div>
  );
}

export default function AdminEmails() {
  const { data: models, isLoading, error } = useEmailModels();
  const { data: dispatchLog } = useEdgeDispatchLog();
  const saveDraft = useSaveEmailDraft();
  const publishDraft = usePublishEmailDraft();
  const unpublish = useUnpublishEmailTemplate();
  const setCronActive = useSetEmailCronActive();
  const runNow = useRunEmailCronNow();

  const [edits, setEdits] = useState<DraftEdits>({});
  const [openModel, setOpenModel] = useState<string | null>(null);
  const [pendingPublish, setPendingPublish] = useState<EmailModelVariant | null>(null);
  const [emailsTab, setEmailsTab] = useTabParam(["modeles", "journal"] as const);

  const activeCount = useMemo(
    () => (models ?? []).filter((m) => modelStatus(m) === "actif").length,
    [models],
  );
  const reviewCount = useMemo(
    () => (models ?? []).filter((m) => needsReview(m)).length,
    [models],
  );

  const handleSave = async (variant: EmailModelVariant) => {
    const patch = edits[variant.slug];
    if (!patch) return;
    const merged = { ...variant, ...patch };
    try {
      await saveDraft.mutateAsync({
        slug: variant.slug,
        subject_fr: merged.subject_fr,
        body_fr: merged.body_fr,
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[variant.slug];
        return next;
      });
      toast.success("Brouillon enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement refusé");
    }
  };

  const handlePublish = async (variant: EmailModelVariant) => {
    try {
      await publishDraft.mutateAsync(variant.slug);
      toast.success(`${variant.slug} activé — les envois utilisent ce texte`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Activation refusée");
    } finally {
      setPendingPublish(null);
    }
  };

  const handleUnpublish = async (variant: EmailModelVariant) => {
    try {
      await unpublish.mutateAsync(variant.slug);
      toast.success(`${variant.slug} désactivé — plus aucun envoi`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Désactivation refusée");
    }
  };

  const handleCron = async (jobname: string, active: boolean) => {
    try {
      await setCronActive.mutateAsync({ jobname, active });
      toast.success(active ? `Cron ${jobname} activé` : `Cron ${jobname} arrêté`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Changement refusé");
    }
  };

  const handleRunNow = async (jobname: string) => {
    try {
      await runNow.mutateAsync({ jobname, dryRun: true });
      toast.success(`Essai lancé sur ${jobname} — aucun email envoyé`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Essai refusé");
    }
  };

  const cronTone = (model: EmailModel): PillTone => {
    if (!model.cron?.exists) return "neutral";
    return model.cron.active ? "success" : "warning";
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Communications"
          icon={Mail}
          tone="blue"
          description={
            <>
              Modèles transactionnels et journal des envois (`email_log`). Les fichiers
              joints d&apos;inscription se gèrent sur{" "}
              <a href="/admin/registration-documents" className="underline underline-offset-2">
                Modèles documents
              </a>
              .
            </>
          }
          tabs={
            <SegmentedControl<EmailsTab>
              value={emailsTab}
              onChange={setEmailsTab}
              ariaLabel="Modèles ou journal des envois"
              options={[
                { value: "modeles", label: "Modèles", icon: FileText, count: models?.length },
                { value: "journal", label: "Journal des envois", icon: History },
              ]}
            />
          }
        />

        {emailsTab === "journal" && <EmailSendJournal />}

        {emailsTab === "modeles" && (
          <div className="space-y-4 lg:space-y-5">
            <StatTileGrid cols={3}>
              <StatTile label="modèles" value={models?.length ?? 0} icon={Mail} tone="blue" loading={isLoading} />
              <StatTile label="actifs" value={activeCount} icon={CheckCircle2} tone="teal" loading={isLoading} />
              <StatTile
                label="en attente de relecture"
                value={reviewCount}
                icon={AlertTriangle}
                tone={reviewCount > 0 ? "gold" : "neutral"}
                loading={isLoading}
              />
            </StatTileGrid>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Lecture impossible</AlertTitle>
                <AlertDescription>
                  {error instanceof Error ? error.message : "Réservé à un compte administrateur."}
                </AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="space-y-3" aria-busy="true">
                <span className="sr-only">Chargement des modèles…</span>
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-28 w-full rounded-[var(--radius-card)]" />
                ))}
              </div>
            )}

            {!isLoading && !error && (models ?? []).length === 0 && (
              <SurfaceCard flush>
                <TableEmpty
                  title="Aucun modèle d'email"
                  description="Aucun modèle transactionnel n'est encore déclaré."
                  icon={Mail}
                />
              </SurfaceCard>
            )}

            {/* Une carte dépliable par modèle : en-tête + cron + textes. */}
            {(models ?? []).map((model) => (
              <Collapsible
                key={model.model_key}
                open={openModel === model.model_key}
                onOpenChange={(open) => setOpenModel(open ? model.model_key : null)}
                className="fli-surface overflow-hidden"
              >
                <div className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base font-semibold leading-tight">
                        {model.position}. {model.title_fr}
                      </h3>
                      <p className="text-sm text-muted-foreground">{model.trigger_fr}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <StatusPill tone="neutral" size="sm">
                          {AUDIENCE_LABELS[model.audience] ?? model.audience}
                        </StatusPill>
                        {model.edge_function && (
                          <code className="rounded-pill bg-[hsl(var(--surface-sunken))] px-2 py-0.5 text-xs ring-1 ring-inset ring-border">
                            {model.edge_function}
                          </code>
                        )}
                        <StatusBadge model={model} />
                      </div>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        {model.variants.length} texte{model.variants.length > 1 ? "s" : ""}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  {model.cron_jobname && (
                    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-3">
                      <div className="min-w-[200px] flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          <StatusPill tone={cronTone(model)} icon={Radio} size="sm">
                            {model.cron?.exists
                              ? model.cron.active
                                ? "Cron actif"
                                : "Cron arrêté"
                              : "Sans cron"}
                          </StatusPill>
                          <span>
                            Cron {model.cron_jobname}
                            {model.cron?.schedule ? ` — ${model.cron.schedule}` : ""}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {model.cron?.exists
                            ? model.cron.active
                              ? "Programmé et actif."
                              : "Programmé, arrêté : rien ne part automatiquement."
                            : "Aucun cron programmé."}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleRunNow(model.cron_jobname!)}
                        disabled={runNow.isPending}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Essai sans envoi
                      </Button>
                      <Switch
                        checked={model.cron?.active ?? false}
                        disabled={!model.cron?.exists || setCronActive.isPending}
                        onCheckedChange={(checked) =>
                          void handleCron(model.cron_jobname!, checked)
                        }
                        aria-label={`Activer le cron ${model.cron_jobname}`}
                      />
                    </div>
                  )}
                </div>

                <CollapsibleContent>
                  <div className="space-y-4 border-t border-border p-4 sm:p-5">
                    {model.variants.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucun brouillon pour ce modèle.
                      </p>
                    )}
                    {model.variants.map((variant) => (
                      <VariantEditor
                        key={variant.slug}
                        variant={variant}
                        edits={edits[variant.slug] ?? {}}
                        busy={saveDraft.isPending || publishDraft.isPending || unpublish.isPending}
                        onChange={(patch) =>
                          setEdits((prev) => ({
                            ...prev,
                            [variant.slug]: { ...prev[variant.slug], ...patch },
                          }))
                        }
                        onSave={() => void handleSave(variant)}
                        onPublish={() => setPendingPublish(variant)}
                        onUnpublish={() => void handleUnpublish(variant)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            <SurfaceCard
              title="Appels sortants pg_net"
              icon={Send}
              description="Chaque déclenchement de cron passe par dispatch_edge_function et laisse une ligne ici."
            >
              {(dispatchLog ?? []).length === 0 ? (
                <TableEmpty
                  title="Aucun appel enregistré."
                  description="Aucun cron n'a encore déclenché d'appel sortant."
                  icon={Send}
                />
              ) : (
                <div className="space-y-2">
                  {(dispatchLog ?? []).map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-border px-3 py-2 text-xs"
                    >
                      <span className="font-mono">{row.function_name}{row.note}</span>
                      <span className="text-muted-foreground tabular">
                        requête #{row.request_id ?? "—"} · {row.auth_mode} ·{" "}
                        {new Date(row.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>
        )}
      </PageShell>

      <AlertDialog
        open={pendingPublish !== null}
        onOpenChange={(open) => !open && setPendingPublish(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer ce texte ?</AlertDialogTitle>
            <AlertDialogDescription>
              À partir de maintenant, {pendingPublish?.slug} part avec le texte affiché.
              L'activation est journalisée et réversible par « Désactiver ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingPublish && void handlePublish(pendingPublish)}
            >
              Valider et activer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
