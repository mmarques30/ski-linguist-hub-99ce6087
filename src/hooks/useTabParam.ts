import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Onglet de page synchronisé avec `?tab=` — rend chaque sous-onglet
 * partageable et adressable depuis la sidebar (sous-menus).
 *
 * @param tabs   valeurs autorisées ; la première est l'onglet par défaut
 * @param param  nom du paramètre d'URL (défaut `tab`)
 */
export function useTabParam<T extends string>(
  tabs: readonly T[],
  param = "tab",
): [T, (next: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const fallback = tabs[0];
  const raw = searchParams.get(param);
  const active = (tabs as readonly string[]).includes(raw ?? "")
    ? (raw as T)
    : fallback;

  const setActive = useCallback(
    (next: string) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next === fallback) params.delete(param);
          else params.set(param, next);
          return params;
        },
        { replace: true },
      );
    },
    [fallback, param, setSearchParams],
  );

  return [active, setActive];
}
