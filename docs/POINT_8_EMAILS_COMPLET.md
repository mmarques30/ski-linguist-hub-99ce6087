# Point 8 — les six modèles d'emails, en entier

Ce document décrit ce qui a été livré, ce qui est en ligne, ce qui attend une
validation, et ce qui reste bloqué côté déploiement.

Écran : **Administration → Emails** (`/admin/emails`).

## 1. Principe

Un texte d'email vit en deux exemplaires :

| Table | Rôle |
|---|---|
| `public.email_template_drafts` | le **brouillon**, librement modifiable, jamais envoyé |
| `public.email_templates` | le **texte en ligne**, celui que les fonctions Edge utilisent |

Rien ne passe du premier au second sans un clic sur « Valider et activer », qui
appelle `publish_email_template_draft(p_slug)`. La RPC recopie le brouillon,
pose `validated_at` / `validated_by` et écrit une ligne `email_modele_valide`
dans `audit_log`. Le retour en arrière (`unpublish_email_template`) passe
`is_active` à faux et journalise `email_modele_desactive`.

Les fonctions Edge ne lisent que des gabarits `is_active = true`. Un modèle non
validé n'a donc aucun chemin d'envoi, même si son cron est activé par erreur.

## 2. Les six modèles

`public.email_models` est le catalogue. Un modèle peut porter plusieurs
variantes (les paliers de relance).

| # | `model_key` | Destinataire | Déclencheur | Variantes |
|---|---|---|---|---|
| 1 | `inscription_confirmation` | stagiaire | validation du formulaire `/register` | 1 |
| 2 | `inscription_ski_monitor_welcome` | stagiaire | inscription moniteur en ligne, avec pièces jointes | 1 |
| 3 | `student_portal_invite` | stagiaire | demande depuis la fiche stagiaire (lien magique) | 1 |
| 4 | `schedule_validation_reminder` | interne FLI | cron quotidien, inscriptions à J-10 sans groupe | 1 |
| 5 | `invoice_reminder` | client / ESF | cron quotidien sur factures échues | 3 — J+7, J+15, mise en demeure J+30 |
| 6 | `satisfaction_survey_reminder` | stagiaire | cron quotidien, questionnaire non rempli | 2 — J+5, J+30 |

Les trois langues (français, anglais, portugais) sont rédigées pour chaque
variante. Le pied de page est identique partout : FLI — France Langues
International, 25 avenue de la Gare, 73800 Montmélian, 04 79 28 21 09,
info@fli.fr.

### Choix de rédaction

- **Modèle 1.** Le brouillon ajoute quatre lignes au texte de juillet : lieu,
  modalité, piste atteinte au test, paiement. La **piste** remplace le code
  CECRL côté stagiaire, conformément à la règle retenue au point 4.
- **Modèle 2.** Le texte en ligne cite encore « FLI Formation ». Le brouillon
  reprend l'identité et le pied de page en vigueur.
- **Modèle 5.** Ton neutre : la facture peut être adressée à une ESF comme à un
  stagiaire. La mention de recouvrement n'apparaît qu'au palier 3, alors que le
  texte codé en dur la plaçait déjà au palier 2.
- **Modèle 6.** Deux paliers seulement, sans insistance.

## 3. État au moment de la livraison

| Modèle | En ligne | Brouillon à relire |
|---|---|---|
| 1 `inscription_confirmation` | oui (texte du point 8-minimal) | oui, enrichi |
| 2 `inscription_ski_monitor_welcome` | oui (texte de juillet) | oui, identité corrigée |
| 3 `student_portal_invite` | oui | identique au texte en ligne |
| 4 `schedule_validation_reminder` | oui | oui |
| 5 `invoice_reminder` | **non** | 3 variantes |
| 6 `satisfaction_survey_reminder` | **non** | 2 variantes |

Les quatre textes en ligne datent d'avant ce mécanisme : ils partent déjà. Les
modèles 5 et 6 n'ont aucun texte actif, donc aucune relance ne peut sortir.

## 4. BL-007 — les crons `pg_net`

### Ce qui n'allait pas

Deux crons existaient, tous deux `active`, et échouaient à chaque exécution
depuis des mois :

```
ERROR: schema "net" does not exist
```

La commande appelait `net.http_post` directement et lisait
`current_setting('app.settings.service_role_key')`, un paramètre jamais posé sur
cette instance. `pg_net` est bien installé ; c'est le `search_path` du contexte
`pg_cron` qui ne contenait pas `net`.

### Le correctif

Les jobs n'exécutent plus qu'un appel :

```sql
SELECT public.dispatch_edge_function('process-invoice-reminders', '{}'::jsonb, 'process-invoice-reminders');
```

`public.dispatch_edge_function()` est `SECURITY DEFINER` avec
`SET search_path TO 'public', 'net', 'vault'`. Elle lit l'URL des fonctions dans
`public.edge_dispatch_config`, le JWT dans le Vault, puis journalise l'appel
dans `public.edge_dispatch_log` (fonction, job, `request_id`, mode
d'authentification, auteur). Les deux tables sont en RLS, lecture réservée à
`is_admin()`.

### Le JWT du cron

Les fonctions Edge lisent elles-mêmes `SUPABASE_SERVICE_ROLE_KEY` dans leur
propre environnement. Le JWT joint par le cron ne sert donc qu'à franchir
`verify_jwt` : la clé anon suffit, et la clé `service_role` n'a pas à être
stockée en base. Le secret s'appelle `edge_dispatch_jwt` ; Paula peut en changer
la valeur sans toucher au code.

### État des jobs

| Job | Planification | État | Motif |
|---|---|---|---|
| `process-invoice-reminders` | `0 9 * * *` | **arrêté** | attend la validation du modèle 5 |
| `process-schedule-reminders` | `15 7 * * *` | **arrêté** | attend l'accord de Paula |
| `process-survey-reminders` | `15 8 * * *` | **arrêté** | attend la validation du modèle 6 |
| `generate-monthly-charges` | `0 2 1 * *` | actif | n'envoie aucun email ; `upsert` sur `(mois, cost_type)` du mois courant, donc idempotent et sans arriéré |

L'activation et l'arrêt se font depuis `/admin/emails` via
`set_email_cron_active(p_jobname, p_active)`, qui refuse tout job hors
`email_models.cron_jobname` et journalise chaque bascule.

## 5. Dérive de schéma corrigée

`supabase/migrations/20260728193000_schedule_reminder_alerts.sql` n'avait jamais
été appliquée sur la base hébergée : `inscriptions.schedule_reminder_sent_at` et
son index étaient absents, et le cron correspondant n'existait pas.

Conséquence observée en live : `process-schedule-reminders` filtrait sur
`.is('schedule_reminder_sent_at', null)`, PostgREST renvoyait une erreur de
colonne inconnue, et la fonction répondait

```
HTTP 500 {"success":false,"error":"Internal error"}
```

y compris en `?dry_run=true`. Le message était opaque parce que l'erreur
PostgREST est un objet simple, pas une instance d'`Error`.

Après rattrapage (`20260915120000`), la même requête répond `HTTP 200`.

## 6. `verify_jwt`

Les quatre fonctions pilotées par cron ne sont appelées depuis aucun écran.
`process-invoice-reminders` et `generate-monthly-charges` étaient en
`verify_jwt = false`, donc invocables publiquement alors que la première
déclenche des envois. Les quatre passent à `verify_jwt = true` ; le cron y accède
avec le JWT du Vault. Ce changement ne prend effet qu'au prochain déploiement.

## 7. Ce qui reste bloqué

1. **`RESEND_API_KEY` est absente** de l'environnement des fonctions Edge.
   Constaté en live : la version déployée de `process-survey-reminders` répond
   `{"success":false,"message":"RESEND_API_KEY not configured"}`. Aucun envoi
   réel n'est possible avant que la clé soit posée.
2. **Les fonctions Edge de cette branche ne sont pas déployées.** La lecture des
   gabarits depuis `email_models` et le contrôle `is_active` ne seront effectifs
   qu'après déploiement. D'ici là, les fonctions en place utilisent leurs textes
   d'origine — sans conséquence, puisque les crons sont arrêtés.
3. Les modèles 2 et 4 sont en ligne avec `validated_at` nul : ils précèdent le
   mécanisme de validation. L'écran les signale « à relire ».

## 8. Journal

Toutes les actions laissent une trace dans `public.audit_log` :

| `action` | Sens |
|---|---|
| `email_modele_valide` | un brouillon est passé en ligne |
| `email_modele_desactive` | un texte en ligne a été retiré |
| `email_cron_active` / `email_cron_desactive` | bascule d'un cron |
| `emails_8_complet_crons` | migration des crons |
| `emails_8_complet_schedule_reminder_colonne` | rattrapage de la colonne manquante |

Les appels sortants sont dans `public.edge_dispatch_log`, visibles en bas de
`/admin/emails` sous « Appels sortants pg_net ».
