# Configuration Stripe — FLI Ski Linguist Hub

## État actuel (production)

| Secret | Statut |
|--------|--------|
| `STRIPE_SECRET_KEY` | Configuré (mode **test**, clé valide) |
| `STRIPE_WEBHOOK_SECRET` | **Manquant** — bloque l'enregistrement automatique des paiements |

Sans le webhook secret, le checkout Stripe peut fonctionner visuellement, mais l'inscription ne sera pas mise à jour dans la base de données.

---

## Étape 1 — Vérifier la clé API (déjà fait)

1. [Stripe Dashboard → API Keys (test)](https://dashboard.stripe.com/test/apikeys)
2. Secret key : `sk_test_...`
3. Lovable → [Cloud → Secrets](https://lovable.dev/projects/34e71e1a-49f7-433e-bb36-fc4d26e86f8e) → `STRIPE_SECRET_KEY`

---

## Étape 2 — Créer le webhook (à faire maintenant)

1. Ouvrir [Stripe → Webhooks (test)](https://dashboard.stripe.com/test/webhooks)
2. Cliquer **Add endpoint**
3. URL de l'endpoint :

```
https://nghkrmvakjomzmfwdhbo.supabase.co/functions/v1/stripe-webhook
```

4. Événements à écouter :
   - `checkout.session.completed`

5. Après création, ouvrir le webhook → **Signing secret** → copier `whsec_...`

6. Dans Lovable Cloud Secrets, ajouter :
   - Nom : `STRIPE_WEBHOOK_SECRET`
   - Valeur : `whsec_...`

7. Redéployer l'application (Publish dans Lovable)

---

## Étape 3 — Vérifier dans l'admin

1. Aller sur **Settings → Intégration de paiement**
2. Le badge doit afficher **Opérationnel** (les deux secrets OK)
3. Cliquer **Vérifier à nouveau** si besoin

---

## Étape 4 — Test end-to-end

1. Ouvrir `/register`
2. Choisir une formation en ligne (ex. 6h — 300 €)
3. À l'étape paiement, choisir **Stripe** (acompte 150 € ou paiement intégral)
4. Carte de test : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : `123`
5. Après paiement, vérifier dans l'admin :
   - Inscription → onglet paiements / statut mis à jour
   - Table `payments` : ligne avec `payment_method = stripe`

---

## Modes de paiement supportés

| Option | Montant Stripe | Solde |
|--------|----------------|-------|
| Acompte Stripe + chèque | 150 € | Solde après formation |
| Paiement intégral Stripe | Prix total | 0 € |
| Virement (acompte ou total) | — | Pas de Stripe |

---

## Passage en production (live)

Quand FLI est prêt pour les vrais paiements :

1. Activer le compte Stripe (vérification KYC)
2. Remplacer `STRIPE_SECRET_KEY` par `sk_live_...`
3. Créer un **nouveau** webhook en mode live avec la même URL
4. Remplacer `STRIPE_WEBHOOK_SECRET` par le `whsec_...` live
5. Redéployer et tester avec un petit montant réel

---

## Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| « Paiement en ligne non configuré » | `STRIPE_SECRET_KEY` absent | Ajouter le secret dans Lovable |
| Checkout OK mais pas de paiement en BD | Webhook non configuré ou secret incorrect | Vérifier `STRIPE_WEBHOOK_SECRET` et les logs Stripe |
| « Invalid signature » dans les logs | Mauvais `whsec_` ou endpoint test/live mélangé | Utiliser le secret du bon mode (test/live) |
| Badge « Clé invalide » | Clé révoquée ou mal copiée | Regénérer dans Stripe Dashboard |
