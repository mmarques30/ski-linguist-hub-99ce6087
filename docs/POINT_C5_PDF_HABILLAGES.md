# C.5 — PDF trois habillages

Migrations :
- `supabase/migrations/20260911150000_c5_evaluation_pdf.sql`
- `supabase/migrations/20260911151000_c5_pdf_generated_at.sql`
- `supabase/migrations/20260911152000_c5_cecrl_scale_descriptions.sql`

Journaux : `c5_evaluation_pdf`, `c5_evaluation_pdf_generated` (aucune donnée personnelle)

Edge function : `generate-evaluation-pdf` (staff / admin, clé service pour le dépôt).
Paula déploie la fonction — ne pas sonder 403/404.

Les `.dotx` ne sont **pas** dans le dépôt. Tableau cours ESF et sections régionales
transcrits dans `src/lib/evaluation-pdf.ts` (copie Deno : `_shared/evaluation-pdf-model.ts`).
Logos d’habillage : `public/evaluation-pdf/` et
`supabase/functions/_shared/evaluation-pdf-assets/` (aucune donnée de test).

## Habillage = `test_bookings.sponsor_type`

| sponsor_type | En-tête | Prix | Particularités |
|---|---|---|---|
| `esf` | logo ESF haut gauche ; titre saison calculée | `app_settings.evaluation_price_ttc` | bande 7 organismes agréés en pied de page 1 ; tableau cours + sections régionales en page 2 |
| `ecole_ski` | `fli-entete-prosneige.png` ; tampon FLI en signature ; pied FLI | idem | même titre saison ; texte justifié dans les marges |
| `dsf` | papier à en-tête A4 `dsf-papier-entete-A4.png` | **aucun** | champ **Entreprise** ; **sans logo FLI** |

Prix : jsonb numérique `45`, lu à la génération, jamais écrit en dur dans le rendu
(sauf valeur seedée).

Identité FLI : `app_settings.fli_identity` (25 avenue de la Gare, 73800 Montmélian,
09 81 84 60 65, info@fli.fr).

Saison : 1er juillet N → 30 juin N+1, titre
`Évaluation en langue vivante saison AAAA / AAAA` (pas d’année de modèle Word).

Sous-titre sous l’en-tête :
`Prénom NOM — [note] / [CECRL] - Niveau [X] - [label] → [objectif] (Langue — évaluateur·rice : Nom)`.

Quatre blocs (ordre d’affichage, contenus C.2/C.3) :
1. Points forts ← `bloc_introduction`
2. À consolider ← `bloc_comprehension`
3. Pour passer au [CECRL suivant] (Niveau [X+1] - [label]) ← `bloc_technique`
4. Clôture ← `bloc_conclusion`

Note méthodologique **uniquement si l’écart note générale / moyenne calculée est non nul**.

Compétences (même ordre et mêmes libellés sur les trois habillages) :
Compréhension, Expression, Structures de la langue, Expression technique et
spécifique, Conversation générale, Appréciation générale.

Barème : `cecrl_scale.niveau` + `cecrl_scale.description`.

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
ALTER TABLE public.cecrl_scale
  DROP COLUMN IF EXISTS niveau,
  DROP COLUMN IF EXISTS description;
COMMIT;
```

Recréer ensuite la vue `test_bookings_complete` et le déclencheur C.4 d'après
`20260911140000_c4_verification_paula.sql` / `20260911130000_c3_dsf_partner_scores.sql`.
Le CHECK historique `attestation_type IN ('generique','alpe_huez','prosneige','dsf')`
n'est rétabli que si des lignes existent encore.
