# Rotation de `edge_dispatch_jwt` : réponses et étape suivante proposée

## Réponses (aucun changement effectué)
1. Gérer les secrets : **More → Cloud → Secrets** (sur mobile : Chat → `...` en bas à droite → Cloud → Secrets).
2. Cet écran gère **uniquement les secrets des fonctions Edge**, pas le Vault Postgres (`vault.secrets`). Les valeurs ne peuvent qu'être écrites, jamais relues après enregistrement.
3. **Non.** `SUPABASE_SERVICE_ROLE_KEY` est fournie automatiquement aux fonctions Edge. Aucun écran ne permet de la voir ni de la copier, et on ne peut ni la créer ni la remplacer dans Secrets.
4. Il n'existe aucune méthode prise en charge pour copier la clé service_role dans le Vault :
   - (a) **Non** : la plateforme a refusé à l'agent la modification du Vault (« Agent access to secrets is not allowed »).
   - (b) Le SQL editor (**More → Cloud → SQL editor**) peut exécuter `vault.update_secret`, mais il faut y coller la valeur, et personne n'y a accès. Il ne règle donc pas le problème.
   - (c) **Le support Lovable est la seule voie** si vous tenez à utiliser la clé service_role elle-même.
5. **Non**, il n'y a pas d'écran Vault. On y trouve Database, Users, Storage, Edge Functions, Secrets, SQL editor, Emails, etc.

## Étape suivante proposée (option 2, sans clé service_role)
- Générer côté serveur un jeton aléatoire `CRON_DISPATCH_TOKEN`, enregistré dans les secrets des fonctions, sans que personne n'ait à le copier.
- Paula ne colle rien : le jeton n'est écrit dans le Vault que par une opération lancée depuis une fonction Edge, avec l'accord de Paula. Si la plateforme refuse aussi cette écriture, la réponse sera « bloqué », sans contournement.
- `isServiceRoleCall` dans `_shared/admin-auth.ts` accepte ce jeton en plus de la clé service_role. Il faut ensuite redéployer les fonctions appelées par cron.
- Vérification : `send-daily-ops-digest?dry_run=true`, sans aucun envoi d'e-mail. Les crons e-mail ne sont pas activés.
- À reporter dans main sur GitHub, sinon le prochain push l'écrasera.
