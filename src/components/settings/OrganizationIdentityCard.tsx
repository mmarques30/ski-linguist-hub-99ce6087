import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ImageOff, Loader2, TriangleAlert, Upload } from "lucide-react";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import fliLogoFallback from "@/assets/fli-logo.png";
import {
  EMPTY_ORGANIZATION_IDENTITY,
  missingRequiredIdentityFields,
  ORGANIZATION_IDENTITY_FIELDS,
  ORGANIZATION_IDENTITY_KEY,
  organizationIdentityToJson,
  parseOrganizationIdentity,
  type OrganizationIdentity,
} from "@/lib/organization-identity";

const ORGANIZATION_ASSETS_BUCKET = "organization-assets";
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_ACCEPT = ["image/png", "image/jpeg", "image/webp"] as const;

function logoExtension(mime: string): string | null {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

/**
 * BL-036 — l'identité de l'organisme s'enregistre vraiment dans
 * `app_settings.fli_identity`, la clé déjà lue par les PDF et les documents.
 */
export function OrganizationIdentityCard() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<OrganizationIdentity>(EMPTY_ORGANIZATION_IDENTITY);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const query = useQuery({
    queryKey: ["app-settings", ORGANIZATION_IDENTITY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", ORGANIZATION_IDENTITY_KEY)
        .maybeSingle();
      if (error) throw error;
      return parseOrganizationIdentity(data?.value);
    },
  });

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: async (identity: OrganizationIdentity) => {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: ORGANIZATION_IDENTITY_KEY,
          value: organizationIdentityToJson(identity),
          description:
            "Identité de l'organisme de formation. Saisie dans /settings, lue par les PDF et les conventions.",
        },
        { onConflict: "key" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["app-settings", ORGANIZATION_IDENTITY_KEY] });
      toast.success("Identité de l'organisation enregistrée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Enregistrement impossible");
    },
  });

  const manquantes = missingRequiredIdentityFields(draft);
  const modifie = query.data
    ? ORGANIZATION_IDENTITY_FIELDS.some(
        (field) => draft[field.key] !== query.data[field.key]
      ) || draft.logo_url !== query.data.logo_url
    : false;

  const displayLogoUrl = draft.logo_url.trim() || fliLogoFallback;

  const handleLogoUpload = async (file: File) => {
    if (!LOGO_ACCEPT.includes(file.type as (typeof LOGO_ACCEPT)[number])) {
      toast.error("Format accepté : PNG, JPEG ou WebP");
      return;
    }
    if (file.size <= 0 || file.size > LOGO_MAX_BYTES) {
      toast.error("Fichier vide ou trop volumineux (max 2 Mo)");
      return;
    }

    const ext = logoExtension(file.type);
    if (!ext) {
      toast.error("Format de logo non reconnu");
      return;
    }

    const path = `logo/org-logo.${ext}`;
    setUploadingLogo(true);
    try {
      const { error } = await supabase.storage
        .from(ORGANIZATION_ASSETS_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;

      const { data } = supabase.storage.from(ORGANIZATION_ASSETS_BUCKET).getPublicUrl(path);
      if (!data.publicUrl) throw new Error("URL publique indisponible");

      setDraft((prev) => ({ ...prev, logo_url: data.publicUrl }));
      toast.success("Logo téléversé — enregistrez l'identité pour le conserver");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléversement impossible");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearLogo = () => {
    setDraft((prev) => ({ ...prev, logo_url: "" }));
  };

  const handleSave = () => {
    if (manquantes.length > 0) {
      toast.error(
        `Renseignez d'abord : ${manquantes.map((f) => f.label.toLowerCase()).join(", ")}`
      );
      return;
    }
    save.mutate(draft);
  };

  return (
    <SurfaceCard
      title="Identité de l'organisation"
      icon={Building2}
      description={`Ces mentions alimentent les conventions, les factures et les PDF d'évaluation. Elles sont enregistrées dans les paramètres de l'application (${ORGANIZATION_IDENTITY_KEY}).`}
      actions={
        query.isLoading ? undefined : (
          <StatusPill tone={manquantes.length > 0 ? "warning" : "success"} dot>
            {manquantes.length > 0
              ? `${manquantes.length} mention${manquantes.length > 1 ? "s" : ""} manquante${manquantes.length > 1 ? "s" : ""}`
              : "Complète"}
          </StatusPill>
        )
      }
    >
      <div className="space-y-6">
        {query.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <span className="sr-only">Chargement...</span>
            <Skeleton className="h-24 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-10 w-full rounded-[var(--radius)]" />
            <Skeleton className="h-10 w-full rounded-[var(--radius)]" />
          </div>
        ) : (
          <>
            {query.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Lecture impossible : {(query.error as Error).message}
                </AlertDescription>
              </Alert>
            )}

            {manquantes.length > 0 && (
              <Alert>
                <TriangleAlert className="h-4 w-4" />
                <AlertDescription>
                  Mentions encore vides :{" "}
                  {manquantes.map((f) => f.label.toLowerCase()).join(", ")}. Aucun
                  document nominatif ne doit être généré avant de les renseigner.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-4">
              <div>
                <Label>Logo de l&apos;organisation</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPEG ou WebP — 2 Mo max. Utilisé sur les factures et les emails.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src={displayLogoUrl}
                  alt="Logo de l'organisation"
                  className="h-16 w-auto rounded-[var(--radius)] border border-border bg-card object-contain p-1"
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={LOGO_ACCEPT.join(",")}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo || save.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Téléverser un logo
                  </Button>
                  {draft.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={uploadingLogo || save.isPending}
                      onClick={handleClearLogo}
                    >
                      <ImageOff className="mr-2 h-4 w-4" />
                      Retirer le logo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {ORGANIZATION_IDENTITY_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`identity-${field.key}`}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    id={`identity-${field.key}`}
                    type={field.inputType ?? "text"}
                    value={draft[field.key]}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                  {field.help && (
                    <p className="text-xs text-muted-foreground">{field.help}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSave} disabled={save.isPending || !modifie}>
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer l&apos;identité
              </Button>
              <Button
                variant="outline"
                onClick={() => setDraft(query.data ?? EMPTY_ORGANIZATION_IDENTITY)}
                disabled={save.isPending || !modifie}
              >
                Annuler
              </Button>
              {!modifie && !save.isPending && (
                <span className="text-sm text-muted-foreground">
                  Aucune modification à enregistrer.
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </SurfaceCard>
  );
}
