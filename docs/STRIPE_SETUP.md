# Configuration Stripe — FLI Ski Linguist Hub

Flux de travail : **GitHub** (code + migrations) + **Supabase** (secrets + déploiement fonctions) + **SQL direct** (données).

## État actuel (production)

| Secret | Statut |
|--------|--------|
| `STRIPE_SECRET_KEY` | Configuré (mode **test**, clé valide) |
| `STRIPE_WEBHOOK_SECRET` | **Manquant** — bloque l'enregistrement automatique des paiements |

Sans le webhook secret, le checkout Stripe peut fonctionner visuellement, mais l'inscription ne sera pas mise à jour dans la base de données.

---

## Étape 1 — Clé API Stripe (déjà fait)

1. [Stripe Dashboard → API Keys (test)](https://dashboard.stripe.com/test/apikeys)
2. Secret key : `sk_test_...`
3. [Supabase → Edge Functions → Secrets](https://supabase.com/dashboard/project/nghkrmvakjomzmfwdhbo/settings/functions)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

---

## Étape 2 — Créer le webhook (à faire)

1. [Stripe → Webhooks (test)](https://dashboard.stripe.com/test/webhooks) → **Add endpoint**
2. URL :

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
supabase functions deploy stripe-webhook check-stripe-config create-registration-checkout submit-registration
```

---

## Étape 3 — Vérifier dans l'admin

1. **Settings → Intégration de paiement**
2. Badge **Opérationnel** = les deux secrets OK + clé valide

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
| `supabase/functions/check-stripe-config/` | Vérifie la config (Settings admin) |
| `supabase/functions/_shared/registration-payments.ts` | Logique montants (150 € / total) |
| `src/components/settings/StripeSettingsCard.tsx` | UI admin |

---

## Modes de paiement

| Option | Montant Stripe | Solde |
|--------|----------------|-------|
| Acompte Stripe + chèque | 150 € | Solde chèque à envoyer à l'inscription (encaissement après clôture du dossier) |
| Paiement intégral Stripe | Prix total | 0 € |
| Virement | — | Pas de Stripe |

---

## Passage en production (live)

1. Activer le compte Stripe (KYC)
2. `supabase secrets set STRIPE_SECRET_KEY=sk_live_...`
3. Nouveau webhook live → même URL Supabase
4. `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...` (live)
5. Redéployer les fonctions + test réel

---

## Dépannage

| Problème | Solution |
|----------|----------|
| « Paiement en ligne non configuré » | `STRIPE_SECRET_KEY` manquant dans Supabase Secrets |
| Checkout OK mais pas de paiement en BD | Configurer `STRIPE_WEBHOOK_SECRET` + redéployer `stripe-webhook` |
| « Invalid signature » | Vérifier que le `whsec_` correspond au bon mode test/live |
| Fonction introuvable | `supabase functions deploy` depuis la branche `main` GitHub |
