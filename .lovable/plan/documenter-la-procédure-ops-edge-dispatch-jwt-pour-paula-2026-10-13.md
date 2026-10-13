# Documenter la procédure ops `edge_dispatch_jwt` pour Paula

Une seule action : créer une fiche ops `docs/OPS_EDGE_DISPATCH_JWT.md`. Aucun changement de code, de secrets, de base ni de cron. Aucune modification de `docs/BACKLOG.md` ou `docs/ETAT_APP_*.md`.

## Contenu de la fiche
1. **Situation** : les crons appellent les fonctions via `dispatch_edge_function()`, qui lit le secret Vault `edge_dispatch_jwt` (id `db561408-…`). Ce secret contient encore la clé anon. Les fonctions protégées refusent donc les appels cron (401/403).
2. **Où sont les écrans** :
   - Secrets des fonctions : More → Cloud → Secrets. Sur mobile : Chat → `...` en bas à droite → Cloud → Secrets. Cet écran ne gère pas le Vault Postgres, et les valeurs ne peuvent pas être relues.
   - SQL : More → Cloud → SQL editor, qui demande une confirmation pour les requêtes sensibles.
   - Il n'y a aucun écran Vault.
3. **Clé service_role** : elle n'est ni visible ni copiable dans Lovable Cloud. Elle n'existe que dans l'environnement des fonctions. Ni Paula ni l'agent ne peuvent la coller dans le Vault : la plateforme a refusé l'écriture par l'agent (« Agent access to secrets is not allowed »).
4. **Procédure retenue** : contacter le support Lovable et lui demander de remplacer la valeur du secret Vault `edge_dispatch_jwt` (id fourni) par la clé service_role du projet, avec la description « JWT service_role pour dispatch_edge_function (cron dispatch). ». Le SQL de référence est fourni sans aucune valeur réelle.
5. **Vérification après rotation**, sans aucun e-mail : la requête du SQL editor qui ne renvoie que le rôle du jeton (attendu : `service_role`), puis le contrôle `send-daily-ops-digest?dry_run=true`. Les crons e-mail restent désactivés.
6. **Alternative écartée pour l'instant** : un jeton cron dédié (option 2). Elle est notée pour plus tard, sans être mise en œuvre.
7. **Fonctions qui échouent en cron tant que le Vault n'a pas été mis à jour** : la liste des fonctions protégées appelées par cron.
