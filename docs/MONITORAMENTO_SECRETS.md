# Monitoramento — secrets Lovable Cloud → Supabase + GitHub

Le menu **Monitoramento** (sous Administration) lit la base via RLS admin et
appelle l’edge `monitoring-status` pour GitHub / scan RLS. Aucun secret ne doit
être placé dans `VITE_*` ni commité dans Git.

## 1. Secrets à créer

| Secret | Où | Usage |
|--------|-----|--------|
| `GITHUB_TOKEN` | Lovable Cloud secrets **ou** Supabase Edge secrets | API GitHub : commits récents, PR ouvertes |
| `GITHUB_REPO` | idem (optionnel) | `owner/repo` — défaut `mmarques30/ski-linguist-hub-99ce6087` |
| `SUPABASE_URL` | déjà fourni par Lovable / Supabase | Client Edge |
| `SUPABASE_ANON_KEY` | déjà fourni | Auth appelant |
| `SUPABASE_SERVICE_ROLE_KEY` | déjà fourni côté Edge | Scan RLS via RPC `monitoring_rls_summary` |
| `RESEND_API_KEY` | déjà (e-mails) | Qualité d’exécution e-mail (via `email_log`) |

Optionnel plus tard (Auth / bots) :

| Secret | Usage |
|--------|--------|
| `SENTRY_DSN` | Erreurs front / Edge (qualité d’exécution) |
| `LOGDRAIN_URL` | Webhook logs Auth / edge vers un agrégateur |

## 2. Lovable Cloud (état actuel)

1. Ouvrir le projet Lovable → **Settings → Secrets** (ou Cloud → Environment).
2. Ajouter `GITHUB_TOKEN` : Personal Access Token GitHub (fine-grained ou classic)
   avec scopes **minimum** :
   - `contents:read` (commits)
   - `pull_requests:read` (PR ouvertes)
   - repo privé : accès lecture au dépôt FLI uniquement
3. Ajouter `GITHUB_REPO=mmarques30/ski-linguist-hub-99ce6087` si le défaut ne convient pas.
4. Redéployer / republier les Edge Functions pour injecter les secrets :
   - `monitoring-status` (nouveau)
5. Vérifier dans l’app : `/monitoramento` → carte « Dépôt Git / commits » passe de
   « Non branché » à OK.

Les secrets Lovable Cloud sont injectés dans le runtime Edge (équivalent
`supabase secrets set` une fois migrés).

## 3. Migration vers Supabase « nu »

Quand le backend quitte Lovable Cloud pour un projet Supabase classique :

```bash
# CLI authentifiée sur le projet cible
supabase secrets set GITHUB_TOKEN=ghp_xxx
supabase secrets set GITHUB_REPO=mmarques30/ski-linguist-hub-99ce6087

supabase functions deploy monitoring-status
```

Appliquer aussi la migration SQL :

```bash
supabase db push
# ou exécuter supabase/migrations/20260930120000_monitoring_rls_summary.sql
```

Copier depuis Lovable (sans les coller dans le chat) :

- URL projet → `VITE_SUPABASE_URL` / `SUPABASE_URL`
- anon key → `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY`
- service role → **uniquement** Edge / CI, jamais le front

## 4. GitHub — créer le token

1. GitHub → Settings → Developer settings → Personal access tokens.
2. Fine-grained : repository `ski-linguist-hub-99ce6087` only ; permissions
   Contents Read, Pull requests Read, Metadata Read.
3. Expiration courte (90 j) + rotation notée dans le calendrier ops.
4. Coller la valeur **uniquement** dans Lovable Secrets / `supabase secrets set`.
5. Ne jamais committer le token ; le `.env` local ne doit pas le contenir.

## 5. Checklist de branchement

- [ ] Migration `monitoring_rls_summary` appliquée en live
- [ ] Edge `monitoring-status` déployée
- [ ] `GITHUB_TOKEN` (+ `GITHUB_REPO`) posés
- [ ] Compte **admin** : menu Monitoramento visible sous Administration
- [ ] `/monitoramento` affiche les tuiles audit / e-mail / DB
- [ ] `/monitoramento/qualidade` lit commits / PR si token OK
- [ ] `/monitoramento/seguranca` : placeholder + suppressions ; RLS si RPC OK
- [ ] `/monitoramento/acessos` : `audit_log` + échecs `email_log`

## 6. Ce que lit chaque sous-menu

| Route | Données sans secrets | Données avec secrets |
|-------|----------------------|----------------------|
| `/monitoramento` | counts DB, audit, email_log | GitHub via edge |
| `/monitoramento/seguranca` | placeholders, deletes audit | RPC RLS |
| `/monitoramento/qualidade` | audit + e-mails | commits / PR |
| `/monitoramento/acessos` | audit_log, email_log | (futur) Auth logs |
