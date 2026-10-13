# Ops — rotation du secret Vault `edge_dispatch_jwt`

Statut au 2026-10-13 : **non fait — en attente du support Lovable.**

## 1. Situation
- Les crons pg_cron appellent les fonctions Edge via `public.dispatch_edge_function()`,
  qui lit le secret Vault `edge_dispatch_jwt` (id `db561408-f658-4558-a45a-2534e118f3b1`)
  et l'envoie en `Authorization: Bearer`.
- Ce secret contient encore la **clé anon**. Depuis le durcissement sécurité,
  `requireServiceRoleOrStaff` / `requireServiceRoleOrAdmin` (`_shared/admin-auth.ts`)
  refusent la clé anon : les appels cron reçoivent 401/403.

## 2. Écrans Lovable Cloud
- Secrets des fonctions Edge : **More → Cloud → Secrets**
  (mobile : Chat → `...` en bas à droite → Cloud → Secrets).
  Ne gère **pas** le Vault Postgres. Valeurs en écriture seule (non relisibles).
- SQL : **More → Cloud → SQL editor** (confirmation demandée pour les requêtes sensibles).
- **Aucun écran « Vault ».**

## 3. Clé service_role
- Ni visible ni copiable dans Lovable Cloud ; uniquement injectée dans
  l'environnement des fonctions Edge (`SUPABASE_SERVICE_ROLE_KEY`).
- Paula ne peut pas la coller ; l'agent ne peut pas écrire dans le Vault
  (refus plateforme : « Agent access to secrets is not allowed »).

## 4. Procédure retenue : support Lovable
Demander au support de remplacer la valeur du secret Vault `edge_dispatch_jwt`
(id ci-dessus) par la clé service_role du projet. SQL de référence (le support
fournit la valeur, jamais dans un chat) :

```sql
SELECT vault.update_secret(
  'db561408-f658-4558-a45a-2534e118f3b1'::uuid,
  '<SERVICE_ROLE_KEY>',
  'edge_dispatch_jwt',
  'JWT service_role pour dispatch_edge_function (cron dispatch).'
);
```

## 5. Vérification après rotation (sans e-mail)
Dans le SQL editor, ne lire que le rôle du jeton :

```sql
SELECT (convert_from(decode(
  translate(split_part(decrypted_secret, '.', 2), '-_', '+/')
  || repeat('=', (4 - length(split_part(decrypted_secret, '.', 2)) % 4) % 4),
  'base64'), 'utf8')::json ->> 'role') AS role
FROM vault.decrypted_secrets
WHERE id = 'db561408-f658-4558-a45a-2534e118f3b1'::uuid;
```

Attendu : `service_role`. Puis contrôle d'auth seul : appel de
`send-daily-ops-digest?dry_run=true` (aucun envoi). Les crons e-mail restent désactivés.

## 6. Alternative écartée pour l'instant
Jeton cron dédié (`CRON_DISPATCH_TOKEN` accepté par `isServiceRoleCall`) — non mis en œuvre.

## 7. Fonctions en échec cron tant que le Vault n'est pas tourné
process-intake-outreach, send-inscription-documents, process-invoice-reminders,
process-schedule-reminders, send-daily-ops-digest.
(process-survey-reminders et generate-monthly-charges n'ont pas ce contrôle : non concernées.)
