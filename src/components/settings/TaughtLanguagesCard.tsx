import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { REGISTRATION_LANGUAGES } from "@/lib/registration-languages";

/**
 * BL-036 — les interrupteurs de langues n'étaient jamais enregistrés : l'écran
 * repartait de la même liste en dur à chaque visite. Ils écrivent maintenant
 * dans `app_settings.taught_languages`.
 */

const SETTING_KEY = "taught_languages";

function parseLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function TaughtLanguagesCard() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ["app-settings", SETTING_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", SETTING_KEY)
        .maybeSingle();
      if (error) throw error;
      return parseLanguages(data?.value);
    },
  });

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: async (languages: string[]) => {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: SETTING_KEY,
          value: languages,
          description:
            "Langues enseignées cochées dans /settings. Le catalogue public reste piloté par registration_offerings.",
        },
        { onConflict: "key" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["app-settings", SETTING_KEY] });
      toast.success("Langues enseignées enregistrées");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Enregistrement impossible");
    },
  });

  const enregistre = query.data ?? [];
  const modifie =
    draft.length !== enregistre.length ||
    draft.some((key) => !enregistre.includes(key));

  const toggle = (key: string, active: boolean) => {
    setDraft((prev) =>
      active ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Langues enseignées</CardTitle>
        <CardDescription>
          Langues ouvertes à la formation. Le catalogue public de `/register`
          reste piloté par les offres de la saison : décocher une langue ici ne
          retire pas une offre déjà publiée.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {REGISTRATION_LANGUAGES.map((language) => (
              <div
                key={language.value}
                className="flex items-center justify-between py-2"
              >
                <span className="font-medium">{language.label}</span>
                <Switch
                  checked={draft.includes(language.value)}
                  onCheckedChange={(checked) => toggle(language.value, checked)}
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => save.mutate(draft)}
                disabled={save.isPending || !modifie}
              >
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer les langues
              </Button>
              <Button
                variant="outline"
                onClick={() => setDraft(enregistre)}
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
