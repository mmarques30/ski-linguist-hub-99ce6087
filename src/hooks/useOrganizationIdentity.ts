import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ORGANIZATION_IDENTITY_KEY,
  parseOrganizationIdentity,
  type OrganizationIdentity,
} from "@/lib/organization-identity";

/**
 * Identité de l'organisme saisie dans `/settings` (BL-036).
 *
 * Lisible sans être connecté : la page publique des conditions générales en a
 * besoin (BL-023). Une lecture en échec ne casse pas la page appelante — elle
 * renvoie `null` et l'appelant masque le bloc d'identité.
 */
export function useOrganizationIdentity() {
  return useQuery<OrganizationIdentity | null>({
    queryKey: ["app-settings", ORGANIZATION_IDENTITY_KEY, "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", ORGANIZATION_IDENTITY_KEY)
        .maybeSingle();
      if (error || !data?.value) return null;
      return parseOrganizationIdentity(data.value);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
