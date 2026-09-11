# C.5 — PDF trois habillages

Migration : `supabase/migrations/20260911150000_c5_evaluation_pdf.sql`

Journaux : `c5_evaluation_pdf`, `c5_evaluation_pdf_generated` (aucune donnée personnelle)

Edge function : `generate-evaluation-pdf` (staff / admin, clé service pour le dépôt).
Paula déploie la fonction — ne pas sonder 403/404.

Les `.dotx` ne sont **pas** dans le dépôt. Tableau cours ESF et sections régionales
transcrits dans `src/lib/evaluation-pdf.ts` (copie Deno : `_shared/evaluation-pdf-model.ts`).

## Habillage = `test_bookings.sponsor_type`

| sponsor_type | En-tête | Prix | Particularités |
|---|---|---|---|
| `esf` | en-tête syndicat | `app_settings.evaluation_price_ttc` | tableau cours, sections régionales |
| `ecole_ski` | en-tête et pied FLI | idem | « Fait à Montmélian » |
| `dsf` | titre calculé | **aucun** | champ **Entreprise** (école / partenaire) |

Prix : jsonb numérique `45`, lu à la génération, jamais écrit en dur dans le rendu
(sauf valeur seedée).

Identité FLI : `app_settings.fli_identity` (25 avenue de la Gare, 73800 Montmélian,
09 81 84 60 65, info@fli.fr).

Contenu commun (données de la ligne) : titre calculé (saison ski juillet–juin),
note méthodologique, grille cinq compétences + appréciation générale au format
`N - CECRL`, niveaux / libellés, quatre blocs.

## Stockage

Bucket privé `evaluation-pdfs`. `test_evaluations.pdf_url` = chemin
`evaluations/<id>.pdf` (URL signée, pas d'objet public).

La génération pose `pdf_url` + `pdf_generated_at` et **laisse le statut `valide`**.
`envoye` et `sent_at` uniquement quand le courriel au candidat ou au commanditaire
est réellement parti — pas encore possible (aucun corps inventé).

`attestation_type` est **supprimé**. `attestation_url` reste (copie du chemin).

Le formateur ne peut pas poser `envoye`. Staff / `service_role` seulement, et
`sent_at` est obligatoire pour `envoye`.

Les réservations DSF restent invisibles au candidat (`test_booking_is_dsf`).

## Hors C.5

C.6 export xlsx — uniquement après validation écrite de C.5.

## Retour arrière

```sql
BEGIN;
DELETE FROM public.app_settings WHERE key IN ('evaluation_price_ttc', 'fli_identity');
ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS attestation_type text;
ALTER TABLE public.test_evaluations
  DROP COLUMN IF EXISTS pdf_url,
  DROP COLUMN IF EXISTS pdf_generated_at,
  DROP COLUMN IF EXISTS sent_at;
DROP POLICY IF EXISTS "rls_evaluation_pdfs_select_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_evaluation_pdfs_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_evaluation_pdfs_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "rls_evaluation_pdfs_delete_admin" ON storage.objects;
DELETE FROM storage.objects WHERE bucket_id = 'evaluation-pdfs';
DELETE FROM storage.buckets WHERE id = 'evaluation-pdfs';
COMMIT;
```

Recréer ensuite la vue `test_bookings_complete` et le déclencheur C.4 d'après
`20260911140000_c4_verification_paula.sql` / `20260911130000_c3_dsf_partner_scores.sql`.
Le CHECK historique `attestation_type IN ('generique','alpe_huez','prosneige','dsf')`
n'est rétabli que si des lignes existent encore.
