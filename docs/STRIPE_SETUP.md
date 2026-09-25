# Configuration Stripe — FLI Ski Linguist Hub

Flux de travail : **GitHub** (code + migrations) + **Supabase** (secrets + déploiement fonctions) + **SQL direct** (données).

## État actuel — vérifier dans l'admin

Ne pas se fier à un statut figé dans ce fichier : la configuration évolue selon l'environnement.

1. Ouvrir **Settings → Intégrations** (`StripeSettingsCard`).
2. La carte appelle l'edge function **`check-stripe-config`** et affiche deux lignes **`StatusRow`** :
   - `STRIPE_SECRET_KEY` — clé présente et valide
   - `STRIPE_WEBHOOK_SECRET` — signing secret présent (Supabase Secrets ou `app_settings`)
3. Badge **Opérationnel** = les deux secrets OK + clé valide. Le badge **Mode live** / **Mode test** indique si les paiements sont réels.
4. Si le webhook manque, utiliser **Configurer le webhook automatiquement** (edge `provision-stripe-webhook`) ou suivre les étapes manuelles ci-dessous.

Sans webhook, le checkout Stripe peut s'afficher, mais l'inscription n'est pas mise à jour automatiquement en base.

Le Checkout est forcé en **EUR** (`locale=fr`, adaptive pricing désactivé) pour éviter une conversion USD selon le navigateur.


---

## Étape 1 — Clé API Stripe

1. [Stripe Dashboard → API Keys (test)](https://dashboard.stripe.com/test/apikeys)
2. Secret key : `sk_test_...`
3. [Supabase → Edge Functions → Secrets](https://supabase.com/dashboard/project/nghkrmvakjomzmfwdhbo/settings/functions)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

---

## Étape 2 — Créer le webhook

### Option A — Automatique (recommandé)

1. Déployer les fonctions (voir ci-dessous), notamment `check-stripe-config` et `provision-stripe-webhook`.
2. Dans l'app : **Settings → Intégration de paiement** → **Configurer le webhook automatiquement**.
3. Le secret est enregistré dans `app_settings` (lecture réservée aux edge functions + admins). Vérifier le badge et les `StatusRow` dans Settings.

### Option B — Script CLI

```bash
export STRIPE_SECRET_KEY=sk_test_...   # depuis Stripe Dashboard
export SUPABASE_ACCESS_TOKEN=...     # optionnel — enregistre le secret + déploie
./scripts/setup-stripe-webhook.sh
```

### Option C — Manuel

1. [Stripe → Webhooks (test)](https://dashboard.stripe.com/test/webhooks) → **Add endpoint**
2. URL (affichée aussi dans Settings après déploiement de `check-stripe-config`) :

```
https://nghkrmvakjomzmfwdhbo.supabase.co/functions/v1/stripe-webhook
```

3. Événement : `checkout.session.completed`
4. Copier le **Signing secret** (`whsec_...`)
5. Ajouter dans Supabase :

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

6. Déployer les edge functions depuis le repo GitHub :

```bash
git clone https://github.com/mmarques30/ski-linguist-hub-99ce6087.git
cd ski-linguist-hub-99ce6087
supabase link --project-ref nghkrmvakjomzmfwdhbo
supabase functions deploy stripe-webhook provision-stripe-webhook verify-registration-checkout check-stripe-config create-registration-checkout submit-registration
```

---

## Étape 3 — Vérifier dans l'admin

1. **Settings → Intégration de paiement**
2. Confirmer via `check-stripe-config` : badge **Opérationnel**, `StatusRow` OK pour les deux secrets.
3. Bouton **Vérifier à nouveau** pour rafraîchir l'état après un changement de secret ou de déploiement.

---

## Étape 4 — Test end-to-end

1. `/register` → formation en ligne (ex. 6h — 300 €)
2. Paiement Stripe (acompte 150 € ou intégral)
3. Carte test : `4242 4242 4242 4242`
4. Vérifier en SQL :

```sql
SELECT id, inscription_id, amount, payment_method, status, stripe_checkout_session_id
FROM payments
WHERE payment_method = 'stripe'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Fichiers clés (repo GitHub)

| Fichier | Rôle |
|---------|------|
| `supabase/functions/create-registration-checkout/` | Crée la session Stripe Checkout |
| `supabase/functions/stripe-webhook/` | Enregistre le paiement après checkout |
| `supabase/functions/check-stripe-config/` | Vérifie la config (Settings admin, `StatusRow`) |
| `supabase/functions/provision-stripe-webhook/` | Provisionnement automatique du webhook |
| `supabase/functions/_shared/registration-payments.ts` | Logique montants (150 € / total) |
| `src/components/settings/StripeSettingsCard.tsx` | UI admin (badge, `StatusRow`, bouton auto) |

---

## Modes de paiement

| Option | Montant Stripe | Solde |
|--------|----------------|-------|
| Acompte Stripe + chèque | 150 € | Solde chèque à envoyer à l'inscription (encaissement après clôture du dossier) |
| Paiement intégral Stripe | Prix total | 0 € |
| Virement | — | Pas de Stripe |

---

## Passage en production (live)

1. Activer le compte Stripe (KYC terminé) — bascule **Live** dans le Dashboard.
2. Mettre à jour la clé via le **chat Lovable** (« Update Stripe secret key ») avec `sk_live_...`
   (le badge Lovable sur `STRIPE_SECRET_KEY` empêche l'édition depuis Cloud → Secrets).
3. **Settings → Intégrations** : le badge doit passer en **Mode live**. Si **Webhook live manquant**
   apparaît, cliquer **Configurer le webhook automatiquement** (crée l'endpoint live + enregistre
   le `whsec_` dans `app_settings`, avec le mode `live`).
4. Vérifier dans [Stripe → Webhooks (live)](https://dashboard.stripe.com/webhooks) qu'un endpoint
   pointe vers  
   `https://nghkrmvakjomzmfwdhbo.supabase.co/functions/v1/stripe-webhook`  
   (événement `checkout.session.completed`). Le webhook de test (`CursorFLI0909`, etc.) ne compte pas.
5. `check-stripe-config` contrôle désormais **l'existence réelle** de l'endpoint dans le mode de la
   clé (pas seulement la présence d'un `whsec_` en base — souvent celui du mode test).
6. Badge **Mode live** + **Opérationnel** uniquement si clé live valide **et** endpoint live présent.
7. Test réel (petit montant) sur `/register` — la page de confirmation ne doit plus afficher
   l'avertissement « mode test ».

**Important :** tant que `STRIPE_SECRET_KEY` commence par `sk_test_`, aucun argent n'arrive sur le compte bancaire FLI. Un secret webhook test laissé en `app_settings` ne suffit **pas** en live.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| « Paiement en ligne non configuré » | `STRIPE_SECRET_KEY` manquant dans Supabase Secrets ; vérifier `StatusRow` dans Settings |
| Impossible de vérifier Stripe | Déployer `check-stripe-config` depuis GitHub puis **Vérifier à nouveau** |
| Checkout OK mais pas de paiement en BD | Configurer `STRIPE_WEBHOOK_SECRET` (auto ou manuel) + redéployer `stripe-webhook` et `verify-registration-checkout` |
| Paiement confirmé mais rien sur Stripe / carte | Vérifier le **mode test** ([dashboard test](https://dashboard.stripe.com/test/payments)) ; carte test `4242…` = pas de débit réel |
| Page « Paiement confirmé » sans trace | La page vérifie la session Stripe ; sans `session_id` valide, le paiement n'est pas confirmé |
| « Opérationnel » alors qu'aucun webhook live n'existe | Ancien bug : un `whsec_` test en `app_settings` suffisait. Corrigé — `check-stripe-config` liste les endpoints Stripe du mode courant. Recréer via **Configurer le webhook automatiquement**. |
| « Invalid signature » | Vérifier que le `whsec_` correspond au bon mode test/live |
| Fonction introuvable | `supabase functions deploy` depuis la branche `main` GitHub |
