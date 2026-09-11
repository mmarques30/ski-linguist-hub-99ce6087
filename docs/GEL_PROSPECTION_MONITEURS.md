# Point 5 — Gel de la prospection « moniteurs de ski »

Migration : `supabase/migrations/20260910150000_gel_prospection_moniteurs.sql`
Backlog : BL-006
Date : 2026-09-10

---

## 1. Constat

| Élément | État avant gel |
|---|---|
| Contacts `ski_monitors` | **4 047**, constitués par reprise de listes externes |
| dont statut `unsubscribed` | **1 209** (30 %) |
| Contacts `partners` | **1 032** (+ 209 `partner_contacts`) |
| Campagnes réellement envoyées | **0** (`intake_outreach_log` vide, `email_log` vide, aucune `course_intakes.outreach_sent_at`) |
| Gabarit d'email `intake_monitor_outreach` | **absent de la base** — l'envoi retombait sur le HTML de repli codé en dur dans l'edge function |
| Lien de désinscription dans l'email | **aucun**, ni dans le gabarit du dépôt ni dans le repli |
| Mention RGPD dans l'email | **aucune** |
| Verrou d'envoi | aucun : un bouton « Informer les moniteurs » dans le back-office déclenchait l'envoi réel, sans simulation préalable |

Un clic sur ce bouton, avec une clé Resend configurée, aurait envoyé un email de
prospection sans base légale affichée, sans lien de désinscription et sans mention
RGPD, à jusqu'à 2 838 personnes. Le filtre `status = 'active'` protégeait les
1 209 désinscrits, mais restait le seul garde-fou.

## 2. Ce que le gel bloque

### 2.1 Envoi — variable d'environnement bloquante

`process-intake-outreach` refuse tout appel tant que
`OUTREACH_MONITEURS_ENABLED` ne vaut pas exactement `true`. La comparaison est
stricte : `True`, `TRUE`, `true ` ou toute autre valeur maintiennent le gel — un
interrupteur de sécurité doit échouer du côté fermé. Le refus intervient **avant
toute lecture de la base moniteurs**, et couvre aussi `?dry_run=true` : une
simulation renvoyait la liste nominative complète des destinataires.

Réponse : `HTTP 403`, `{"success": false, "frozen": true, "error": "..."}`.

### 2.2 Envoi — condition de réouverture vérifiée à l'exécution

Même variable posée, la fonction refuse d'envoyer un email dont le corps rendu
ne contient pas **à la fois** un lien de désinscription et une mention RGPD, ou
dont une variable de gabarit n'a pas été substituée. Le contrôle est déterministe
sur le gabarit : il échoue à la première itération, donc **avant le premier envoi**.

Réponse : `HTTP 422`, avec la liste des éléments manquants.

Logique dans `supabase/functions/_shared/outreach-freeze.ts`, couverte par
`src/lib/outreach-freeze.test.ts` (20 cas).

### 2.3 Tables en lecture seule

`ski_monitors` et `partners` sont gelées en écriture par trois couches :

1. **Déclencheur `prospection_gelee()`** en `BEFORE INSERT OR UPDATE OR DELETE`
   (par ligne) et en `BEFORE TRUNCATE` (par instruction, car `TRUNCATE` ne
   déclenche pas les déclencheurs par ligne). C'est la seule couche qui
   s'applique aussi à la clé **service-role** — laquelle contourne la RLS. Toute
   écriture, y compris depuis une edge function ou un script d'import, lève `P0001`.
2. **Politiques RLS** : `rls_*_insert`, `rls_*_update`, `rls_*_delete` supprimées.
   Seule la lecture staff (`rls_*_select`) subsiste.
3. **Droits** : `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ... FROM anon, authenticated`.

La **lecture reste ouverte au staff** : le gel interdit d'écrire et d'envoyer,
pas de consulter. Une demande d'accès ou d'effacement RGPD reste traitable, par
migration tracée.

### 2.4 Déclencheurs et tâches planifiées

Inventaire au moment de la migration : **aucune** tâche `cron.job` et **aucun**
déclencheur ne visait `process-intake-outreach`. Les deux seules tâches planifiées
en production sont `generate-monthly-charges` et `process-invoice-reminders`, sans
rapport avec la prospection.

La migration comporte néanmoins deux boucles défensives et idempotentes :

- toute tâche `cron.job` dont la commande cite `process-intake-outreach` est
  déprogrammée ;
- tout déclencheur sur `ski_monitors`, `partners`, `course_intakes` ou
  `intake_outreach_log` dont la fonction cite `process-intake-outreach`,
  `net.http_post` ou `resend` est supprimé.

Elles couvrent le cas d'un déclenchement ajouté hors dépôt, depuis la console
Supabase. Les déclencheurs `set_*_updated_at` sont conservés : ils n'envoient rien.

### 2.5 Back-office

| Écran | Effet |
|---|---|
| `/gestion/moniteurs` | Bandeau « Prospection moniteurs gelée ». Bouton d'envoi remplacé par la mention « Envoi gelé ». « Ajouter un moniteur » et « Importer CSV » désactivés. Les lignes de la table ne sont plus cliquables (le formulaire était un formulaire d'édition). |
| `/gestion/moniteurs` → Écoles de ski | « Matcher automatiquement » et « Créer » (partenaire) désactivés. « Lier » reste actif : il n'écrit que dans `ski_schools`. |
| `/partenaires` | Bandeau « Base partenaires en lecture seule ». « Nouveau partenaire » et « BD ESF » désactivés. |
| `/admin/import` → import inscriptions FLI | L'import des stagiaires et des inscriptions reste ouvert. L'enrichissement de la base moniteurs est ignoré et signalé dans le rapport d'import. |

Ces garde-fous côté client ne sont pas la protection : ils évitent de proposer
une action qui échouerait, et affichent un message explicite plutôt qu'une erreur
de politique de sécurité. La protection est en base.

### 2.6 Gabarit désactivé

`email_templates.is_active = false` pour le slug `intake_monitor_outreach`.
Cette colonne n'est lue par aucune fonction : la désactivation vaut marquage
documentaire.

## 3. Preuve

Voir `/opt/cursor/artifacts/point_b_gel_prospection_preuve.log` — tentatives
d'écriture et d'envoi rejetées, avec contrôle négatif.

## 4. Conditions de réouverture

Deux conditions **cumulatives** :

1. **Validation écrite de la direction.** Aucune réactivation sans elle.
2. **Lien de désinscription et mention RGPD dans chaque email.** Cette condition
   n'est pas déclarative : elle est vérifiée à l'exécution, et l'envoi est refusé
   sans elle même si la variable d'environnement est posée.

Ce que la réouverture suppose, en plus de la levée technique :

- un gabarit `intake_monitor_outreach` en base, portant les deux mentions et une
  variable `unsubscribe_url` par destinataire ;
- une route publique de désinscription qui bascule `ski_monitors.status` en
  `unsubscribed` sans authentification, à partir d'un jeton non devinable ;
- la suppression du HTML de repli codé en dur dans l'edge function, ou son
  alignement sur les mêmes exigences ;
- une base légale documentée pour les 4 047 contacts repris de listes externes.

## 5. Script de retour (down)

À exécuter dans une **migration** — pas à la main — après validation écrite.

```sql
-- 1. Lever le garde-fou d'écriture
DROP TRIGGER IF EXISTS gel_prospection_ski_monitors ON public.ski_monitors;
DROP TRIGGER IF EXISTS gel_prospection_partners ON public.partners;
DROP TRIGGER IF EXISTS gel_prospection_truncate_ski_monitors ON public.ski_monitors;
DROP TRIGGER IF EXISTS gel_prospection_truncate_partners ON public.partners;
DROP FUNCTION IF EXISTS public.prospection_gelee();

-- 2. Rétablir les droits
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.ski_monitors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.partners TO anon, authenticated;

-- 3. Rétablir les politiques d'écriture
CREATE POLICY "rls_ski_monitors_insert" ON public.ski_monitors
  FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_ski_monitors_update" ON public.ski_monitors
  FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_ski_monitors_delete" ON public.ski_monitors
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "rls_partners_insert" ON public.partners
  FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_partners_update" ON public.partners
  FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_partners_delete" ON public.partners
  FOR DELETE TO authenticated USING (is_admin());

-- 4. Réactiver le gabarit (seulement s'il porte désinscription + mention RGPD)
UPDATE public.email_templates
SET is_active = true, updated_at = now()
WHERE slug = 'intake_monitor_outreach';

-- 5. Lever l'état de gel
UPDATE public.app_settings
SET value = jsonb_set(value, '{gelee}', 'false'::jsonb), updated_at = now()
WHERE key = 'prospection_moniteurs';

-- 6. Journaliser la levée
INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'levee_gel_prospection_moniteurs',
  'ski_monitors',
  jsonb_build_object('validation_ecrite', '<référence de la validation>')
);
```

Puis, côté application :

- passer `PROSPECTION_MONITEURS_GELEE` à `false` dans `src/lib/prospection-gel.ts` ;
- poser `OUTREACH_MONITEURS_ENABLED=true` dans les secrets de la fonction.

Aucune de ces deux actions ne suffit seule : le contrôle de conformité RGPD à
l'exécution reste en place et continue de refuser tout email non conforme.

## 6. Points laissés ouverts

- **`course_intakes` reste modifiable.** Créer une date de formation n'envoie rien
  tant que le gel tient ; la table n'a pas été gelée pour ne pas bloquer la
  planification. À arbitrer.
- **`partner_contacts` et `partner_contracts` restent modifiables.** Le gel demandé
  portait sur `ski_monitors` et `partners`. `partner_contacts` contient 209 contacts
  nominatifs : à arbitrer.
- **`submit-registration`** envoie encore un pack de bienvenue aux moniteurs qui
  s'inscrivent eux-mêmes via `/register`. C'est un email transactionnel consécutif
  à une démarche volontaire, hors prospection : laissé actif.
- **Base légale des 4 047 contacts** : à documenter au registre avant toute
  réouverture.
