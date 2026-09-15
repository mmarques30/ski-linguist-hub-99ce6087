import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  EMPTY_ORGANIZATION_IDENTITY,
  missingRequiredIdentityFields,
  ORGANIZATION_IDENTITY_FIELDS,
  ORGANIZATION_IDENTITY_KEY,
  organizationIdentityToJson,
  parseOrganizationIdentity,
  type OrganizationIdentity,
} from "@/lib/organization-identity";

/**
 * BL-036 — l'identité de l'organisme s'enregistre vraiment dans
 * `app_settings.fli_identity`, la clé déjà lue par les PDF et les documents.
 */
export function OrganizationIdentityCard() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<OrganizationIdentity>(EMPTY_ORGANIZATION_IDENTITY);

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
      )
    : false;

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
    <Card>
      <CardHeader>
        <CardTitle>Identité de l&apos;organisation</CardTitle>
        <CardDescription>
          Ces mentions alimentent les conventions, les factures et les PDF
          d&apos;évaluation. Elles sont enregistrées dans les paramètres de
          l&apos;application ({ORGANIZATION_IDENTITY_KEY}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {query.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
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

            <div className="grid gap-4 md:grid-cols-2">
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
      </CardContent>
    </Card>
  );
}
