# Pack emails FLI — 17/09/2026

Source validée par Paula : zip `emails-fli` + `00-CONSIGNES-CURSOR.md`.

## Contenu

- `00-CONSIGNES-CURSOR.md` — règles d'implémentation (Option A)
- `01a` … `11` — 17 textes (`.html` / `.txt` / `.meta.txt`)
- `_index.json` — catalogue machine

## Intégration dépôt

Migration : `supabase/migrations/20260917180000_emails_11_modeles_paula.sql`

- Catalogue `email_models` (11 familles)
- Brouillons `email_template_drafts` (17 slugs)
- **Aucun** texte auto-publié, **aucun** cron activé

Publier depuis `/admin/emails` après relecture.

## Hors de cette livraison (à brancher ensuite)

- Tâche +30 min `inscription_documents`
- Crons J-11 / 2 h, day0 satisfaction, formateur 17h30
- `send-schedule-convocation`, `send-convention`, pack fin auto, bilan école
- `resend-webhook`
