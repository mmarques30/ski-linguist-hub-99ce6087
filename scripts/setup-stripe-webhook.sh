#!/usr/bin/env bash
set -euo pipefail

# Configure Stripe webhook for FLI Ski Linguist Hub.
# Requires: STRIPE_SECRET_KEY (sk_test_... or sk_live_...)
# Optional: SUPABASE_ACCESS_TOKEN to set STRIPE_WEBHOOK_SECRET in Supabase automatically

PROJECT_REF="nghkrmvakjomzmfwdhbo"
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/stripe-webhook"
EVENT="checkout.session.completed"

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "Erreur: exportez STRIPE_SECRET_KEY=sk_test_..." >&2
  exit 1
fi

echo "→ Recherche d'un webhook existant pour ${WEBHOOK_URL}"

existing_id=""
while IFS= read -r line; do
  id=$(echo "$line" | jq -r '.id')
  url=$(echo "$line" | jq -r '.url')
  if [[ "$url" == "$WEBHOOK_URL" ]]; then
    existing_id="$id"
    break
  fi
done < <(curl -s -G https://api.stripe.com/v1/webhook_endpoints \
  -H "Authorization: Bearer ${STRIPE_SECRET_KEY}" \
  --data-urlencode "limit=100" | jq -c '.data[]')

if [[ -n "$existing_id" ]]; then
  echo "→ Webhook existant: ${existing_id} — régénération du signing secret"
  secret=$(curl -s -X POST "https://api.stripe.com/v1/webhook_endpoints/${existing_id}/secret" \
    -H "Authorization: Bearer ${STRIPE_SECRET_KEY}" | jq -r '.secret')
else
  echo "→ Création du webhook Stripe"
  response=$(curl -s -X POST https://api.stripe.com/v1/webhook_endpoints \
    -H "Authorization: Bearer ${STRIPE_SECRET_KEY}" \
    -d "url=${WEBHOOK_URL}" \
    -d "enabled_events[0]=${EVENT}" \
    -d "description=FLI Ski Linguist Hub — inscriptions /register")
  existing_id=$(echo "$response" | jq -r '.id')
  secret=$(echo "$response" | jq -r '.secret')
fi

if [[ -z "$secret" || "$secret" == "null" ]]; then
  echo "Erreur: impossible d'obtenir whsec_..." >&2
  exit 1
fi

echo ""
echo "Webhook configuré: ${existing_id}"
echo "Signing secret: ${secret}"
echo ""

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "→ Enregistrement dans Supabase Secrets"
  npx supabase@latest secrets set "STRIPE_WEBHOOK_SECRET=${secret}" --project-ref "${PROJECT_REF}"
  echo "→ Déploiement des edge functions"
  npx supabase@latest functions deploy stripe-webhook verify-registration-checkout provision-stripe-webhook check-stripe-config create-registration-checkout submit-registration --project-ref "${PROJECT_REF}"
  echo ""
  echo "Terminé. Vérifiez Settings → Intégration de paiement (badge Opérationnel)."
else
  echo "Ajoutez manuellement dans Supabase → Edge Functions → Secrets :"
  echo "  STRIPE_WEBHOOK_SECRET=${secret}"
  echo ""
  echo "Puis déployez :"
  echo "  supabase login"
  echo "  supabase secrets set STRIPE_WEBHOOK_SECRET=${secret} --project-ref ${PROJECT_REF}"
  echo "  supabase functions deploy stripe-webhook verify-registration-checkout provision-stripe-webhook --project-ref ${PROJECT_REF}"
fi
