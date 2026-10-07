# SMS transactionnels — Brevo (V1)

Date : 2026-10-07  
Edge : `send-staff-sms`  
Expéditeur : `FLI` (alphanumérique, 11 car. max)

## Prérequis chez Brevo

1. Compte Brevo avec crédits SMS.
2. Enregistrer le **Sender ID** `FLI` pour la France (transactionnel).
3. Créer une clé API **v3** (SMTP & API → API keys) : elle commence par `xkeysib-`.
   - Ne pas utiliser la clé SMTP (`xsmtpsib-…`) — Brevo répond alors `Key not found`.
   - Copier la clé **complète** à la création (Brevo la masque ensuite).
4. Coller la clé dans les **secrets Edge** Lovable / Supabase : nom exact `BREVO_API_KEY` (sans espace, sans préfixe `Bearer`).

Ne jamais committer la clé.

## Usage dans l’app

- Liste / fiche stagiaire → bouton **SMS** (si téléphone normalisable).
- Modèles :
  - **Mail reçu / spam** (`staff_sms_mail_check`)
  - **Acompte 150 €** (`staff_sms_payment`) — inclut le Payment Link Stripe
  - **Message libre** (`staff_sms_manual`)
- Journal : `/admin/emails` (`email_log`, champ destinataire = numéro E.164).

## Hors V1

- Relances SMS automatiques (cron)
- Campagnes marketing Brevo (ne pas mettre de code STOP dans les SMS transactionnels)
