import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useTabParam } from "@/hooks/useTabParam";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Loader2,
  Mail,
  PlayCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
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

function StatusBadge({ model }: { model: EmailModel }) {
  const status = modelStatus(model);
  if (status === "actif") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Actif
      </Badge>
    );
  }
  if (status === "partiel") {
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Partiellement actif
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      Brouillon
    </Badge>
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

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{variant.variant_label || variant.slug}</p>
          <p className="font-mono text-xs text-muted-foreground">{variant.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {variant.is_active ? (
            <Badge className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Texte actif
            </Badge>
          ) : (
            <Badge variant="outline">Jamais envoyé</Badge>
          )}
          {!variant.in_sync && <Badge variant="secondary">À relire</Badge>}
        </div>
      </div>

      {variant.notes && (
        <p className="text-xs text-muted-foreground">{variant.notes}</p>
      )}

      <Tabs defaultValue="fr">
        <TabsList>
          <TabsTrigger value="fr">Texte</TabsTrigger>
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="fr" className="space-y-2 pt-3">
          <Input
            value={merged.subject_fr}
            placeholder="Sujet"
            onChange={(e) => onChange({ subject_fr: e.target.value })}
          />
          <Textarea
            value={merged.body_fr}
            placeholder="Corps HTML"
            rows={12}
            className="font-mono text-xs"
            onChange={(e) => onChange({ body_fr: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Les emails transactionnels partent uniquement en français.
          </p>
        </TabsContent>

        <TabsContent value="apercu" className="space-y-2 pt-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Sujet : </span>
            {renderPreview(merged.subject_fr)}
          </p>
          <div
            className="prose prose-sm max-w-none rounded bg-muted/40 p-3 text-sm"
            dangerouslySetInnerHTML={{ __html: renderPreview(merged.body_fr) }}
          />
          <p className="text-xs text-muted-foreground">
            Aperçu avec un jeu ZZTEST : aucune donnée réelle, aucune adresse délivrable.
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-2 text-xs">
        {merged.variables.map((name) => (
          <code key={name} className="rounded bg-muted px-1.5 py-0.5">
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
          <Button size="sm" variant="ghost" onClick={onUnpublish} disabled={busy}>
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
  const [emailsTab, setEmailsTab] = useTabParam(["modeles", "journal"] as const);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6" />
            Communications
          </h1>
          <p className="text-sm text-muted-foreground">
            Modèles transactionnels et journal des envois (`email_log`). Les fichiers
            joints d&apos;inscription se gèrent sur{" "}
            <a href="/admin/registration-documents" className="underline underline-offset-2">
              Modèles documents
            </a>
            .
          </p>
        </div>

        <Tabs value={emailsTab} onValueChange={setEmailsTab}>
          <TabsList>
            <TabsTrigger value="modeles">Modèles</TabsTrigger>
            <TabsTrigger value="journal">Journal des envois</TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="mt-4 space-y-4">
            <EmailSendJournal />
          </TabsContent>

          <TabsContent value="modeles" className="mt-4 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{models?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">modèles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{reviewCount}</p>
              <p className="text-xs text-muted-foreground">en attente de relecture</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Lecture impossible</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Réservé à un compte administrateur."}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground">Chargement des modèles…</p>
        )}

        {(models ?? []).map((model) => (
          <Card key={model.model_key}>
            <Collapsible
              open={openModel === model.model_key}
              onOpenChange={(open) => setOpenModel(open ? model.model_key : null)}
            >
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {model.position}. {model.title_fr}
                    </CardTitle>
                    <CardDescription>{model.trigger_fr}</CardDescription>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline">
                        {AUDIENCE_LABELS[model.audience] ?? model.audience}
                      </Badge>
                      {model.edge_function && (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {model.edge_function}
                        </code>
                      )}
                      <StatusBadge model={model} />
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {model.variants.length} texte{model.variants.length > 1 ? "s" : ""}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                {model.cron_jobname && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Cron {model.cron_jobname}
                        {model.cron?.schedule ? ` — ${model.cron.schedule}` : ""}
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
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="space-y-4">
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
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appels sortants pg_net</CardTitle>
            <CardDescription>
              Chaque déclenchement de cron passe par dispatch_edge_function et laisse une
              ligne ici.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(dispatchLog ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun appel enregistré.</p>
            ) : (
              <div className="space-y-2">
                {(dispatchLog ?? []).map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-xs"
                  >
                    <span className="font-mono">{row.function_name}{row.note}</span>
                    <span className="text-muted-foreground">
                      requête #{row.request_id ?? "—"} · {row.auth_mode} ·{" "}
                      {new Date(row.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

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
