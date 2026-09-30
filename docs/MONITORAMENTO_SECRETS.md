# Monitoring — secrets Lovable Cloud → Supabase + GitHub

Module **Monitoring** (`/monitoramento`) : santé DB, erreurs, commits GitHub,
sécurité des tables et journal d'accès. Les pages fonctionnent en mode local
(audit_log) sans secrets ; le flux GitHub / Sentry s'active après configuration.

## Secrets à enregistrer

| Secret | Obligatoire | Usage |
|--------|-------------|--------|
| `GITHUB_TOKEN` | Oui (qualité Git) | PAT fine-grained ou classic avec `contents:read` + `pull_requests:read` |
| `GITHUB_REPO` | Oui | `owner/repo` — ex. `mmarques30/ski-linguist-hub-99ce6087` |
| `SENTRY_DSN` | Non | Agrégation d'erreurs runtime (prévu) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto | Déjà injecté par Lovable Cloud / Supabase sur les Edge Functions |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Auto | Runtime Edge |

Ne jamais committer ces valeurs dans Git. Elles vivent uniquement dans les
stores de secrets (Lovable, Supabase, CI).

---

## A. Lovable Cloud (état actuel)

1. Ouvrir le projet dans **Lovable** → **Settings / Cloud / Secrets**
   (ou *Project settings → Secrets* selon l'UI).
2. Ajouter :
   - `GITHUB_TOKEN` = `github_pat_…` ou `ghp_…`
   - `GITHUB_REPO` = `mmarques30/ski-linguist-hub-99ce6087`
   - `SENTRY_DSN` = `https://…@….ingest.sentry.io/…` (optionnel)
3. Redéployer / republier le projet pour que les Edge Functions voient les
   nouvelles variables.
4. Dans l'app admin : **Monitoring → Vue d'ensemble** — la carte
   *Secrets monitoring* doit passer à **Opérationnel** pour GitHub.

> Pendant la migration Lovable Cloud → Supabase self-managed, garder les mêmes
> noms de clés pour éviter un double câblage.

---

## B. Supabase (cible de migration)

1. [Dashboard → Edge Functions → Secrets](https://supabase.com/dashboard/project/nghkrmvakjomzmfwdhbo/settings/functions)
2. CLI (recommandé, depuis une machine avec `supabase` lié) :

```bash
supabase link --project-ref nghkrmvakjomzmfwdhbo

supabase secrets set \
  GITHUB_TOKEN=github_pat_xxxxxxxx \
  GITHUB_REPO=mmarques30/ski-linguist-hub-99ce6087

# optionnel
supabase secrets set SENTRY_DSN=https://xxxx@o0.ingest.sentry.io/0
```

3. Déployer les fonctions Monitoring :

```bash
supabase functions deploy check-monitoring-config monitoring-overview
```

4. Vérifier dans l'UI : `/monitoramento` → pastille *GitHub connecté* sur
   **Qualité**.

---

## C. Créer le token GitHub

1. GitHub → **Settings → Developer settings → Personal access tokens**
   - Fine-grained (recommandé) : repo `ski-linguist-hub-99ce6087`, permissions
     **Contents: Read**, **Pull requests: Read**, **Metadata: Read**
   - Classic : scopes `repo` (lecture) ou au minimum `public_repo` si le dépôt
     est public
2. Copier le token **une seule fois** dans Lovable + Supabase Secrets.
3. Rotation : régénérer le PAT, mettre à jour les deux stores, redeploy edges.

Lien direct : https://github.com/settings/tokens?type=beta

---

## D. GitHub Actions / CI (optionnel)

Pour que la CI puisse aussi publier des métriques ou appeler l'API :

Repository → **Settings → Secrets and variables → Actions** :

| Name | Value |
|------|--------|
| `GITHUB_TOKEN` | fourni automatiquement par Actions — ne pas écraser sauf besoin d'un PAT dédié |
| `MONITORING_GITHUB_TOKEN` | PAT dédié si le token workflow est trop restreint |
| `SENTRY_AUTH_TOKEN` | upload source maps (si Sentry activé) |

Le front n'utilise **jamais** ces secrets CI : uniquement les Edge Functions.

---

## E. Checklist post-cutover Supabase

- [ ] Secrets `GITHUB_TOKEN` + `GITHUB_REPO` présents dans Supabase
- [ ] Fonctions `check-monitoring-config` et `monitoring-overview` déployées
- [ ] Admin ouvre `/monitoramento` → santé DB verte
- [ ] `/monitoramento/qualidade` liste commits / PRs
- [ ] `/monitoramento/seguranca` affiche le catalogue des tables sensibles
- [ ] `/monitoramento/acessos` lit `audit_log` (7 jours)
- [ ] Aucun secret dans `.env` commités (seulement `VITE_SUPABASE_*` anon)

---

## Fonctions Edge

| Fonction | Rôle |
|----------|------|
| `check-monitoring-config` | Statut des secrets (admin only) |
| `monitoring-overview` | Agrégat DB + GitHub + exécutions 24 h (admin only) |

Auth : `requireAdmin` (même garde que `cleanup-zztest` / invites).

---

## Mode dégradé

Si les edges ne sont pas encore déployées, le front bascule sur un **repli
client** : ping `app_settings` + lecture `audit_log` / `email_log`. La carte
Secrets indique alors *À configurer* avec le message d'erreur Edge.
