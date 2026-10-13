# Rotation `edge_dispatch_jwt` — Lovable Cloud uniquement

Ce projet (**Ski School Connect / FLI**, Lovable `34e71e1a-49f7-433e-bb36-fc4d26e86f8e`)
tourne sur **Lovable Cloud** (backend intégré). Ce n’est **pas** un projet Supabase
appartenant au compte FLI : **ne pas** ouvrir
`https://supabase.com/dashboard/project/nghkrmvakjomzmfwdhbo` pour la clé
`service_role` (inaccessible / hors périmètre).

Éditeur : https://lovable.dev/projects/34e71e1a-49f7-433e-bb36-fc4d26e86f8e

## Deux magasins de secrets (ne pas les confondre)

| Magasin | Chemin UI Lovable | Contenu |
|---------|-------------------|---------|
| **Secrets Cloud** (env Edge) | **More → Cloud → Secrets** (mobile : Chat → `…` → Cloud → Secrets) | Variables injectées dans les Edge Functions (`STRIPE_*`, `RESEND_*`, etc.). Write-only après enregistrement. |
| **Vault Postgres** (`vault.secrets`) | **Aucun écran « Vault »** | Secret DB `edge_dispatch_jwt` lu par `public.dispatch_edge_function()` pour l’en-tête `Authorization` des crons. Créé par migration SQL (`vault.create_secret`). |

**More → Cloud → Secrets** ne gère **pas** le Vault Postgres.

Autres écrans Cloud utiles : Database, Users, Storage, Edge functions, Jobs,
**SQL editor** (`More → Cloud → SQL editor`). Pas d’écran nommé Vault.

## `SUPABASE_SERVICE_ROLE_KEY` : jamais visible dans l’UI

Docs Lovable (`docs.lovable.dev/features/secrets`) :

- le préfixe `SUPABASE_` est **réservé** (URL, anon, **service_role**, DB URL) ;
- ces valeurs sont injectées automatiquement dans les Edge Functions ;
- on **ne peut ni les créer ni les écraser** dans Secrets ;
- on **ne peut jamais relire** une valeur de secret après enregistrement.

Docs Supabase troubleshooting (Lovable Cloud) : la **service role key n’est pas
accessible** pour les projets managés Lovable Cloud (intégrations externes type
n8n / Make, etc.).

**Conséquence pour Paula :** elle ne peut **pas** coller la clé `service_role`
depuis un écran Lovable — Lovable ne la surface pas. Ne jamais coller une clé
dans le chat Cursor / Lovable.

## État actuel du secret Vault

- Nom : `edge_dispatch_jwt`
- Rôle : JWT Bearer joint par `dispatch_edge_function()` vers les Edge Functions
- Historique : initialisé avec la clé **anon** (migration Point 8) — insuffisant
  dès que les edges exigent `service_role` ou staff (`admin-auth.ts`)
- Métadonnées vérifiées en lecture seule (2026-10) : description encore « clé anon »

## Que faire concrètement (sans coller de secret dans le chat)

### 1. Si l’objectif est d’utiliser la vraie clé `service_role` dans le Vault

**Seul chemin sûr documenté aujourd’hui : support Lovable.**

Demander au support Lovable (projet Cloud ci-dessus) de faire tourner
`vault.update_secret` pour `edge_dispatch_jwt` vers la clé service_role du
backend, **sans** vous la communiquer ni la coller dans un chat.

Raisons :

- l’agent Lovable a répondu **« Agent access to secrets is not allowed »** pour
  une rotation Vault privilégiée ;
- le **SQL editor** (`More → Cloud → SQL editor`) peut en théorie exécuter
  `vault.update_secret(uuid, …)`, mais il faudrait y coller la valeur — et
  personne côté FLI n’a accès à `SUPABASE_SERVICE_ROLE_KEY` sur Cloud.

### 2. Alternative produit (sans clé service_role) — à valider avec Paula

Lovable a proposé un jeton dédié `CRON_DISPATCH_TOKEN` (généré côté serveur,
écrit dans Secrets Edge + Vault, accepté par `admin-auth` en plus de
service_role). Ce n’est **pas** la rotation service_role ; c’est un redesign
d’auth cron. À n’engager qu’après OK explicite de Paula (éditeur / secure form
si Lovable le demande). Ne pas coller de secret dans le chat.

### 3. Ce qu’il ne faut pas faire

- Ouvrir le dashboard Supabase standalone pour ce projet Cloud
- Coller `service_role` / JWT dans Cursor, Lovable chat, e-mail ou ticket public
- Croire que **More → Cloud → Secrets** met à jour `vault.secrets`

## Références

- Lovable Secrets : https://docs.lovable.dev/features/secrets
- Lovable Cloud : https://docs.lovable.dev/features/cloud
- Supabase « Can’t Access Supabase Project When Using Lovable Cloud » :
  https://supabase.com/docs/guides/troubleshooting/cant-access-supabase-project-lovable-cloud
- Migration initiale Vault : `supabase/migrations/20260915110000_emails_8_complet_crons.sql`
- Dispatch : `public.dispatch_edge_function()` lit `vault.decrypted_secrets`
