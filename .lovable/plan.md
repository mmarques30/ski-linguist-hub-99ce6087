# Analyse des findings Security (scan du 7 oct. 2026, 14:58 UTC) — aucun correctif appliqué

## Finding 1 — Critical « Access control & authorization »
1. **Concerné** : deux tables techniques de l'import accents BL033, `public._bl033_dedup_map` et `public._bl033_log`. Le contrôle est `LOV.DB.RLS_DISABLED.V1` (ids `lov_db_rls_disabled_v1_51d3ea868b32f425` et `..._b7a353bc65671534`). Lovable les affiche comme un seul finding.
2. **Pourquoi Critical** : la RLS est désactivée sur ces deux tables. Elles sont dans `public`, donc toute personne qui a la clé publique de l'app peut les lire, les modifier ou les vider, à condition que les droits par défaut ne leur aient pas été retirés.
3. **Correctif minimal recommandé** :
   - Option A (la plus simple) : si l'import BL033 est terminé, supprimer les deux tables.
   - Option B : les garder, mais seulement pour les admins.
   ```sql
   ALTER TABLE public._bl033_dedup_map ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public._bl033_log       ENABLE ROW LEVEL SECURITY;
   REVOKE ALL ON public._bl033_dedup_map, public._bl033_log FROM anon, authenticated;
   GRANT ALL ON public._bl033_dedup_map, public._bl033_log TO service_role;
   -- (facultatif) lecture admin :
   -- GRANT SELECT ... TO authenticated; CREATE POLICY ... USING (public.is_admin());
   ```
   Aucun impact sur l'app : aucun écran ne lit ces tables.

## Finding 2 — Warning « Exposed personal & sensitive data »
1. **Concerné** : la règle d'accès `rls_registration_waitlist_anon_insert` sur la table `public.registration_waitlist_requests`. Le contrôle est `LOV.DB.RLS_TAUTOLOGY_PERMISSIVE.V1`.
2. **Pourquoi Warning** : la règle accepte tout ajout anonyme sans aucun contrôle sur le contenu (`WITH CHECK (true)`). Personne ne peut lire les données, mais n'importe qui peut ajouter des lignes de spam ou mal formées. C'est un Warning et non un Critical parce que c'est le comportement voulu pour un formulaire de liste d'attente public, conforme à la règle « Anon = insert-only ».
3. **Correctif minimal recommandé** : remplacer `true` par une vraie vérification. Exemple :
   ```sql
   WITH CHECK (
     status = 'pending'            -- ou la valeur par défaut réelle
     AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     AND length(coalesce(message,'')) < 2000
   )
   ```
   Il faut adapter cette vérification aux vraies colonnes de la table, que je n'ai pas encore vérifiées. Autre option : ignorer ce finding en le justifiant (formulaire public voulu).

## 43 issues de dépendances
Le dernier scan des dépendances (29 sept.) ne contient aucune ligne et n'est plus à jour. Je n'ai pas encore listé les 43 issues ; il faut lancer un scan des dépendances pour les détailler.

## Remarque
Le scan base de données n'est plus à jour (`up_to_date: false`). Il faudra le relancer après correctif pour fermer les findings.
