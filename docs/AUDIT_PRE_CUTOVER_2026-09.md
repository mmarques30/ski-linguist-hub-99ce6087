# Audit pré-cutover — FLI Formation

**Date :** 2026-09-09  
**Auteure métier :** Paula (directrice FLI, seule opératrice)  
**Périmètre :** audit de fiabilité avant bascule Excel → app (cible 1er octobre 2026)  
**Règle respectée :** aucune modification de code applicatif, aucune migration, aucune correction « au passage ». Ce fichier est le livrable unique.

**Preuves :** code du dépôt `main` / branche d’audit ; requêtes SQL en lecture seule sur le projet Supabase `nghkrmvakjomzmfwdhbo` (via Lovable Cloud DB) le 2026-09-09.

**E-facturation (hors questions 1–20) :** laissée **hors périmètre d’implémentation** jusqu’à avril 2027. Recommandation opérationnelle immédiate : demander à Acom une confirmation écrite qu’ils assurent la **réception** des factures électroniques pour FLI dès l’obligation en vigueur ; ne pas engager de chantier app sur ce sujet avant la haute saison.

**Règles de cohérence futures (Partie 2)** : consignées en fin de document pour tout travail ultérieur, après validation de cet audit.

---

## PARTIE 1 — Réponses aux 20 questions

### Q1 — Questions de placement (`src/data/placement-questions/`)

**Verdict :** pour les **9 langues** de test (hors `auto-diagnostic.json`), chaque fichier contient **25 questions** : **20 grammaire** (5 par piste verte / bleue / rouge / noire) + **5 vocabulaire ski** (`slope: vocab_ski`, `category: vocabulaire`).

| Fichier | Total | Grammaire | Vocab ski |
|---------|------:|----------:|----------:|
| `allemand.json` | 25 | 20 | 5 |
| `anglais.json` | 25 | 20 | 5 |
| `chinois.json` | 25 | 20 | 5 |
| `espagnol.json` | 25 | 20 | 5 |
| `fle.json` | 25 | 20 | 5 |
| `italien.json` | 25 | 20 | 5 |
| `neerlandais.json` | 25 | 20 | 5 |
| `portugais.json` | 25 | 20 | 5 |
| `russe.json` | 25 | 20 | 5 |

**Russe / chinois — hypothèse « Q1–10 en français + réponses cible ; Q11–20 entièrement en langue cible » :**

- **Q11–20 :** confirmé — énoncés et options entièrement en cyrillique (russe) / sinogrammes (chinois). Fichiers : `src/data/placement-questions/russe.json`, `chinois.json`.
- **Q1–10 :** **partiellement conforme**. Les énoncés sont **cadrés en français**, avec souvent une phrase à compléter **déjà en langue cible** dans l’énoncé ; les **options de réponse sont en langue cible**. Ce n’est pas « question 100 % française + réponses cible » sans mélange : plusieurs items Q1–10 contiennent déjà du russe/chinois dans `question_text`.
- **Q21–25 (vocabulaire) :** énoncés en français, options en langue cible (même logique que le vocabulaire des autres langues).

**Preuve moteur :** `src/lib/placement-test-engine.ts` (`QUESTIONS_PER_SLOPE = 5`, pistes `verte|bleue|rouge|noire|vocab_ski`).

---

### Q2 — Affichage du résultat au stagiaire (piste vs CECRL)

**Verdict : le CECRL est montré au stagiaire — ce n’est pas réservé au back-office.**

| Endroit | Ce qui est affiché | Preuve |
|---------|-------------------|--------|
| Fin du test `/register` | Badge **« Niveau estimé » = CECRL** (`A1`…`C1`) **et** badges de pistes | `src/components/registration/PlacementTestStep.tsx` (l. ~182 : `result.determinedLevel`) |
| Confirmation `/register` | Badge `data.currentLevel` (= CECRL issu du test) | `src/components/registration/ConfirmationStep.tsx` |
| Portail stagiaire | Badge `entry_level` brut | `src/pages/student/StudentDashboard.tsx` |
| Mapping piste → CECRL | `determineLevelFromSlopes` → A1/A2/B1/B2/C1 | `src/lib/placement-test-engine.ts` |

Les pistes sont aussi affichées (« Parcours des pistes »), mais **le niveau estimé principal est un code CECRL**.

**Emails / PDF stagiaire avec CECRL :** non vérifié comme template dédié « résultat placement » (un seul template email en base : voir Q6/Q7). Les comptes-rendus formateur utilisent bien le CECRL (`src/lib/evaluation-utils.ts` `scoreToLevel`, `EvaluationPDFPreview`).

**Écart avec la règle métier souhaitée :** aujourd’hui le code **viole** la règle « pistes pour le stagiaire / CECRL back-office + CR ».

---

### Q3 — JSON des phrases d’évaluation

| Point | Constat | Preuve |
|-------|---------|--------|
| Fichier source | `src/data/test_phrases_import.json` | présent |
| Metadata | déclare `total_phrases: 540` | metadata du JSON |
| Contenu réel | **321** phrases (écart metadata) | comptage JSON |
| Catégories présentes | `introduction`, `comprehension`, `expression` (libellé UI « Expression / Prononciation »), `grammar`, `technique`, `conclusion` | JSON + `src/lib/evaluation-utils.ts` |
| Pas de catégorie `prononciation` ni `vocabulaire` nommées ainsi | `expression` / `grammar` à la place | comptage |
| Import en base | **Non** — table `test_phrases` = **0 lignes** | SQL 2026-09-09 |
| UI d’import | `/admin/import-phrases` et `/admin/phrases` | `src/pages/admin/ImportPhrases.tsx`, `Phrases.tsx` |
| Usage formateur | `PhraseSelector` lit `useTestPhrases` → table vide ⇒ sélecteur vide | `src/components/evaluation/PhraseSelector.tsx`, `src/pages/formateur/EvaluationForm.tsx` |

**Conclusion :** le catalogue JSON existe côté repo, **n’est pas importé**, donc **non utilisé en production** par `/formateur/evaluations`.

---

### Q4 — Lien `placement_tests` (entrée) ↔ `test_evaluations` (sortie)

**Verdict : aucune requête / vue dédiée de comparaison entrée/sortie pour une même inscription.**

- `placement_tests` : 596 lignes ; colonnes `inscription_id`, `determined_level`, etc. (`types.ts`).
- `test_evaluations` : **0 lignes** ; lié au parcours **`test_bookings`** (évaluation formelle), pas à `placement_tests`.
- Sur `inscriptions` : colonnes `entry_level` et `exit_level` existent ; `exit_level` est renseigné manuellement via End Pack (`src/hooks/useEndPack.ts`), pas via jointure aux évaluations.
- Aucune vue SQL du type « entry vs exit » trouvée dans `supabase/migrations/` ni dans les hooks.

Dire clairement : **non, ce lien comparatif n’existe pas.**

---

### Q5 — Origine des ~4 047 `ski_monitors` et ~1 032 `partners`

#### `ski_monitors` (4047)

| Fait | Preuve |
|------|--------|
| Volume | SQL : 4047 ; 2838 `active`, 1209 `unsubscribed` |
| Création | `created_at` entre 2026-07-29 11:00 et 11:56 (import batch) |
| Script / edge | `scripts/import-ski-monitors.mjs`, `scripts/call-import-ski-monitors.mjs`, edge `supabase/functions/import-ski-monitors` |
| Fichier source déclaré | `FLI_Listing_Complet_Contacts_7d13.csv` (chemin uploads agent, **fichier non présent dans le repo**) |
| Notes en base | quasi vides (4036) ; 11 « Source: inscriptions FLI » |
| `partner_id` | **0** moniteur lié à un partenaire |

**Consentement / information des personnes :** **non vérifiable** dans le code ni en base (pas de champ consentement, pas de preuve d’opt-in, seulement un statut `unsubscribed` technique). Les libellés de listes sur d’autres tables (`ContactsFLI2018`, `MagasinsdeSport`, etc.) indiquent des **listes de contacts FLI historiques**, pas un annuaire tiers nommé dans le repo — **mais l’origine légale exacte et le consentement ne sont pas documentés dans le dépôt.**

#### `partners` (1032)

| Sous-ensemble | Volume approx. | Source |
|---------------|---------------:|--------|
| Import BD ESF (`esf_code` non null / notes « Import BD ESF ») | 209 | `scripts/generate-esf-import-sql.py` → CSV `BD_ESF_caa7.csv` (hors repo) ; commit message branche moniteurs : « import BD ESF directeurs (209 partenaires nationaux) » |
| Notes « Directeur (restauré…) » | 342 | notes en base |
| Notes « Import FLI contacts » + listes (`MagasinsdeSport`, `ContactsFLI2018`, …) | plusieurs centaines | notes `partners` |
| Total | 1032 | SQL |

**Consentement partenaires / moniteurs listés :** **non vérifiable** dans le code.

---

### Q6 — `process-intake-outreach`

**Fichier :** `supabase/functions/process-intake-outreach/index.ts`

| Question | Réponse vérifiée |
|----------|------------------|
| Que fait-elle ? | Pour un `intake_id` donné, charge un `course_intakes`, sélectionne des `ski_monitors` `active` (école hôte ou tous si `open_to_other_schools`), envoie un email via **Resend**, journalise `intake_outreach_log` + `email_log`, met à jour `outreach_sent_at` |
| À qui ? | Emails des moniteurs actifs (potentiellement **toute** la base active si session ouverte) |
| Fréquence | **Pas de cron** : appel HTTP avec `intake_id` (manuel / déclenché). `course_intakes` = **0** lignes ⇒ aucun outreach possible aujourd’hui |
| Contenu | Template DB `email_templates.slug = 'intake_monitor_outreach'` **ou** HTML de repli générique. **Ce slug est absent** : seul template présent = `inscription_ski_monitor_welcome` |
| Désinscription | **Aucun lien unsubscribe** dans la fonction / `_shared` |
| Active (cron) ? | **Non** — absente de `cron.job` |
| Historique | `intake_outreach_log` = **0** |

**Risque RGPD :** la fonction peut mass-mailer la base moniteurs dès qu’un intake existe et que `RESEND_API_KEY` est configurée — sans opt-out dans le mail.

---

### Q7 — Crons / jobs programmés actifs

**Requête :** `SELECT jobid, jobname, schedule, active FROM cron.job`

| jobid | jobname | Schedule | Active | État réel des runs |
|------:|---------|----------|--------|--------------------|
| 1 | `generate-monthly-charges` | `0 2 1 * *` (1er du mois 02:00 UTC) | oui | **Échoue** : `schema "net" does not exist` |
| 2 | `process-invoice-reminders` | `0 9 * * *` (quotidien 09:00 UTC) | oui | **Échoue** : même erreur |

**Extensions :** `pg_cron` présent ; **`pg_net` absent** ⇒ les `net.http_post` des crons ne peuvent pas s’exécuter.

**Présents dans les migrations mais absents de `cron.job` :**

- `process-schedule-reminders` (migration `20260728193000_schedule_reminder_alerts.sql`, prévu 08:00 UTC) — **non enregistré** en base au 2026-09-09.
- Aucun cron pour `process-survey-reminders` ni `process-intake-outreach`.

---

### Q8 — Qualiopi / satisfaction / amélioration / documents

| Écran | Route | Fonctionnel ? | Lignes DB |
|-------|-------|---------------|-----------|
| Satisfaction | `/satisfaction-stats` | **Lecture + calculs** sur `satisfaction_surveys` + export PDF jsPDF ; UI réelle (`useSatisfactionStats`) | `satisfaction_surveys` = **0** ⇒ KPIs à zéro |
| Amélioration continue | `/amelioration` | **CRUD réel** (`useContinuousImprovement`) types dont `RECLAMATION` | `continuous_improvement` = **0** |
| Audit Qualiopi | `/qualite/audit` | **CRUD indicateurs** + KPIs auto (`useQualiopiAudit` / `useAutoIndicators`) ; impression navigateur | `qualiopi_indicators` = **0** |
| Historique audit | `/qualite/historique` | lecture `audit_log` | non compté ici |
| Documents (médiathèque) | `/documents` | **Maquette** : tableau `documents = []` en dur, upload non branché | n/a |

**Preuves :** `src/pages/SatisfactionStats.tsx`, `ContinuousImprovement.tsx`, `qualite/QualiopiAudit.tsx`, `Documents.tsx` (l. 114 : `const documents: Document[] = []`).

---

### Q9 — Signature contrats formateurs

**RPC :** `sign_instructor_contract_by_token(p_token, p_signature_data)` — migration `20260731150000_security_rls_hardening.sql`.

| Attendu e-sign « fort » | Présent ? |
|-------------------------|-----------|
| Horodatage | **Oui** — `signed_at = now()` |
| Adresse IP | **Non** |
| Hash du document | **Non** |
| PDF archivé à la signature | Colonne `pdf_url` existe ; **aucune logique de génération/archivage au moment du sign** dans la RPC |
| Nature de `signature_data` | Texte libre (typiquement payload signature / image) — **case / trait stocké**, pas une plateforme eIDAS |

**Table :** `instructor_contracts` = **0** lignes ; `instructors` = **0**.

**Clause RNQ dans le modèle de contrat :** **non vérifiable** — aucun modèle de contrat (texte/PDF) trouvé dans le repo qui contienne « RNQ » / « Référentiel National Qualité » lié à `instructor_contracts`. Seule mention « référentiel national » vue dans l’UI satisfaction (`SatisfactionStats.tsx`), hors contrats.

---

### Q10 — Module réclamations

**Pas de module dédié** (pas de route `/reclamations`, pas de table `reclamations`).

**Existe :** type d’action `RECLAMATION` dans `/amelioration` (`ContinuousImprovement.tsx` / table `continuous_improvement`) — registre générique, **0 lignes**.

---

### Q11 — Documents : génération PDF vs envoi de pièces

| Document recherché | Généré PDF par l’app ? | Envoyé / stocké ? | Preuve |
|--------------------|------------------------|-------------------|--------|
| Devis | Non (texte « sur devis ») | Non automatisé | `CourseSelectionStep` |
| Convention de formation | **Non générée** | Fichier statique `.dotx` attaché au pack bienvenue | `public/registration-documents/convention-stage-langues-station-2022.dotx`, `registration-welcome-documents.ts` |
| Convocation | Label prévu (`CONVOCATION`) | **Aucun générateur** trouvé | labels seulement |
| Certificat | **Oui** (html2canvas + jsPDF) | Enregistrement ligne `certificates` (pdf_url optionnel) | `CertificatePreview.tsx`, `useEndPack.ts` |
| Attestation | Labels / end pack | Pas de moteur PDF attestation dédié clair | labels `ATTESTATION_PRESENCE` |
| Compte-rendu évaluation (4 modèles) | **Aperçu + `window.print`** (pas 4 templates PDF distincts) | Dépend de `test_evaluations` (0) | `EvaluationPDFPreview.tsx` |
| Facture | **Aperçu HTML** `InvoiceTemplate` (pas de bouton print/PDF trouvé sur `/invoices`) | Création ligne `invoices` (0 aujourd’hui) | `InvoiceTemplate.tsx`, `Invoices.tsx` |
| Critères FIFPL / programme | Fichiers statiques PDF/DOTX | Email pack moniteur via Resend | `submit-registration` + `document_sendings` |

**`document_sendings` :** **0** lignes. Types prévus : `REGLEMENT`, `CONVENTION`, `PROGRAMME`, (+ labels LIVRET, CONVOCATION, ATTESTATION_PRESENCE, CERTIFICAT, FACTURE).

---

### Q12 — Inscription groupe école de ski (sans `/register` individuel)

**Non.** Aucun flux « école inscrit N stagiaires en une fois ».

- `/register` = parcours **individuel**.
- Back-office : création inscription unitaire (`InscriptionFormDialog`).
- « Groupe » dans l’UI = modalité pédagogique ou attribution matin/après-midi (`ScheduleValidation`), pas multi-inscription école.

---

### Q13 — Année fiscale / numérotation factures

**Fonction live `get_fiscal_year(invoice_date)` :**

```sql
RETURN TO_CHAR(invoice_date, 'YYYY');  -- année civile
```

**Trigger `before_invoice_insert` :** `fiscal_year` = année civile ; numéro `FLI-YYYY-NNNN` (sequence par année civile, repart de 0001 si aucune facture `FLI-YYYY-%`).

**Preuve :** définition live via `pg_get_functiondef` ; migration `20260406115943_…sql`.

**Écart métier FLI :** exercice souhaité **01/07 → 30/06** (transition 01/10/2025 → 30/06/2026) **n’est pas** implémenté dans `get_fiscal_year` / numérotation.

**Note :** l’UI finance utilise ailleurs une « saison » juillet–juin (`getSaison` dans `useFinancialDashboard.ts`) — **filtre d’analyse**, pas la numérotation.

---

### Q14 — Factures fournisseurs formateurs

| Table | Rôle | Lignes |
|-------|------|-------:|
| `formation_costs` | coûts liés formation (`instructor_id`, `montant_*`, `document_url`) — **peut** porter un coût formateur, **pas** une facture fournisseur structurée (pas de n° facture fournisseur, etc.) | 0 |
| `instructor_payments` | paiements formateurs | 0 |
| `instructors` | | 0 |

**Verdict :** **aucune table dédiée « factures fournisseurs formateurs »** ; le plus proche est `formation_costs` / `instructor_payments`, tous deux vides et sans cycle facture fournisseur complet.

---

### Q15 — État webhook Stripe

| Élément | État | Preuve |
|---------|------|--------|
| Secret webhook | **Présent** dans `app_settings` clé `stripe_webhook_secret` (JSON `secret` + `endpoint_id`), `updated_at` 2026-09-09 | SQL (valeur **non reproduite** ici) |
| Documentation repo | `docs/STRIPE_SETUP.md` indiquait encore le secret « manquant » — **obsolète** vs base live |
| Paiements Stripe en base | **Aucun** : 1 seul `payments` = virement 150 € `en_attente`, `invoice_id` null, pas de `stripe_checkout_session_id` | SQL |
| `invoices` | **0** | SQL |
| Test E2E « checkout → payments + statut invoice » | **non vérifiable** comme réussi en base (pas de trace Stripe réussie) | |

---

### Q16 — Numérotation : continuité, trous, suite Excel

| Point | Constat |
|-------|---------|
| Factures en base | **0** ⇒ aucune séquence réelle à auditer |
| Format actuel | `FLI-YYYY-NNNN` à partir de 1 pour l’année civile |
| Ancien format (migration initiale janv. 2026) | `YYYY.sequence` avec seed `MAX(sequence_number)` ou **14242** | `20260114183254_….sql` |
| Continuité avec Excel | **Non garantie** par le code actuel : le trigger ne reprend pas le dernier numéro Excel ; avec 0 factures, le prochain insert partirait à `FLI-2026-0001` (si date 2026) |
| Doublons | contrainte UNIQUE sur `invoice_number` | migration avr. 2026 |
| Import CSV | `/admin/import` peut **imposer** `invoice_number` si fourni (`Import.tsx`) — risque de collision / trous si mal conduit ; **non testé** faute de données |

**Verdict :** continuité Excel **non vérifiée / non implémentée** dans l’état actuel.

---

### Q17 — État de l’import historique

**Volumes live (2026-09-09) :**

| Table | Lignes |
|-------|-------:|
| `students` | 631 |
| `inscriptions` | 906 |
| `placement_tests` | 596 |
| `ski_monitors` | 4047 |
| `partners` | 1032 |
| `invoices` | **0** |
| `payments` | **1** |
| `sessions` / `instructors` / `test_phrases` / `test_evaluations` / … | **0** |

**Sources / scripts d’import (repo) :**

- Inscriptions : `scripts/generate-fli-import-sql.py` (CSV `incriptions_29072026_….csv` hors repo), `src/lib/fli-inscriptions-csv-import.ts`, UI `/admin/import`
- Réponses formulaires : `generate-form-import-sql.py`, `useFliFormResponsesImport`
- ESF : `generate-esf-import-sql.py`
- Moniteurs : `import-ski-monitors.mjs`

**Format source décrit dans les parsers** (point-virgule, etc.) : oui côté `fli-inscriptions-csv-import` / scripts — **le fichier source et le journal des rejets ne sont pas dans le repo** ; nombre exact de rejets / lignes non importées : **non vérifiable** sans le CSV d’origine et les logs d’import.

**Factures historiques :** explicitement **non importées** (0 lignes) — cohérent avec `docs/MIGRATION_PLAN.md` (prévu cutover).

**Qualité `entry_level` importé :** majoritairement libellés libres / null / encoding cassé (« Faux d�butant »), très peu de CECRL propres — SQL `GROUP BY entry_level`.

---

### Q18 — Données orphelines

| Contrôle | Résultat (SQL 2026-09-09) |
|----------|---------------------------|
| Inscription sans stagiaire (`student_id` null ou join échoué) | **0** |
| Facture sans inscription | **0** (0 factures) |
| Paiement avec `invoice_id` pointant vers facture absente | **0** |
| Paiement **sans** facture (`invoice_id` null) | **1** (le virement 150 €) — pas orphelin au sens FK cassée, mais **non rattaché** à une facture |
| Session sans formateur | **0** (0 sessions) |

Pas d’orphelins FK majeurs sur le périmètre demandé ; **trou fonctionnel** : paiement sans facture.

---

### Q19 — `.env` et clés

| Élément | Constat |
|---------|---------|
| `.env` commité | Oui — `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Rôle de la clé | JWT `role: anon` (clé **anon** / publishable) |
| Service role dans `.env` / fichiers trackés | **Non trouvé** comme valeur de clé |
| Mentions `SUPABASE_SERVICE_ROLE_KEY` | Uniquement via `Deno.env` / variables d’environnement scripts (pas de secret en clair dans le repo) |
| Historique git `.env` | Même clé anon depuis le commit initial Lovable |

**Verdict :** seule la clé **anon** est exposée dans le repo ; **aucune service role key en clair** trouvée dans le dépôt ou l’historique `.env` inspecté. (La clé anon reste publique par design front ; RLS doit la contenir.)

---

### Q20 — Branches non fusionnées dans `main`

Branches distantes avec commits **non** ancêtres de `origin/main` (au 2026-09-09) :

| Branche | Contenu (dernier message) | Recommandation |
|---------|---------------------------|----------------|
| `origin/cursor/auditoria-plano-refatoracao-fli-6852` | Doc audit/refactor structurel (2026-07-28) | **Garder** en archive doc **ou** extraire le md utile puis **supprimer** la branche — ne pas merger tel quel (périmètre refactor, hors cutover) |
| `origin/cursor/dashboard-gestao-redesign-mockup-7ad2` | Mockup dashboard (PR #3 merge partielle ? commits locaux encore ahead) | **Garder** jusqu’à validation mockup `/mockup/dashboard-gestao` ; **ne pas merger** avant nov. si change structurel UI |
| `origin/cursor/update-ski-monitor-docs-a412` | MAJ pack docs Station 2022 | Vérifier si déjà repris sur `main` (welcome docs) ; sinon **fusionner après relecture fichiers** ou **supprimer** si doublon |
| `origin/lovable-sync-1785513051` | « Deployed Stripe edge functions » + Changes | **Ne pas merger** à l’aveugle ; comparer au Stripe déjà sur `main` ; **supprimer** si redondant |

Toutes les autres branches `cursor/*` listées sont **déjà contenues** dans `main` (`ahead=0`) — candidates **suppression** de branches distantes pour hygiène (sans effet runtime).

---

## PARTIE 2 — Règles de cohérence (à appliquer après validation)

1. Interface en **français** ; plus de nouveau texte PT ; migration progressive du portugais existant.  
2. Écriture inclusive (point médian) pour stagiaires / formateur·rices / écoles.  
3. Vouvoiement textes externes ; tutoiement écrans internes uniquement.  
4. **Pistes** pour auto-évaluation stagiaire ; **CECRL** back-office + CR formateur·rice uniquement. *(aujourd’hui non respecté — voir Q2)*  
5. TVA : formation exonérée ; tests et sous-traitance 20 %.  
6. Trois types de factures ; numérotation séquentielle unique.  
7. Tests de langue ≠ formation (BPF).  
8. **Aucun** envoi auto vers listes externes (moniteurs/partenaires) sans validation explicite de Paula.  
9. Pas de nouvelle fonctionnalité avant le 1er octobre — fiabilité, import, zéro orphelin.  
10. Migrations SQL réversibles + documentées dans `docs/`.  
11. Ne jamais supprimer de données réelles sans question préalable.

---

## PARTIE 3 — Priorisation cutover

### Bloquant pour le 1er octobre 2026

| # | Item | Pourquoi bloquant | Effort estimé |
|---|------|-------------------|---------------|
| B1 | **Import factures (+ paiements) historiques** + règle de reprise de numérotation Excel | Sinon double saisie / trous / litiges numéros dès nov. | **12–20 h** (parse CSV, mapping, dry-run, validation Paula) |
| B2 | **Corriger `get_fiscal_year` / trigger** pour exercice 01/07–30/06 (+ transition) | Numéros faux dès la première facture app | **3–5 h** (SQL réversible + tests manuels + doc) |
| B3 | **Aligner affichage niveau stagiaire** (pistes only ; CECRL back-office) | Non-conformité règle métier + confusion stagiaires | **4–6 h** UI register + portail |
| B4 | **Vérifier E2E Stripe** (checkout test → `payments` + lien facture/inscription) maintenant que le secret existe | Encaissements nov. dépendants | **2–4 h** test + correctifs mineurs si échec |
| B5 | **Décision / gel outreach moniteurs** (désactiver ou verrouiller `process-intake-outreach` + pas de cron) | Risque RGPD mass-mail 2 838 emails actifs | **1–2 h** (config + consigne ops ; pas de feature) |
| B6 | **Fichier delta Excel** tenu à jour + procédure J cutover | Déjà dans `MIGRATION_PLAN.md` | **effort Paula métier** (hors dev) + **2–3 h** tech support |
| B7 | **Import `test_phrases`** si les CR formateurs doivent tourner en saison | Sinon CR sans phrases pré-rédigées | **1–2 h** import admin (si JSON validé) |

**Total tech bloquant indicatif : ~25–42 h** (hors saisie métier Paula).

### Peut attendre avril 2027

| Item | Motif |
|------|--------|
| Redesign dashboard Gestao (mockup) | Non critique saison |
| Module réclamations dédié | Type existe dans amélioration |
| E-sign formateurs eIDAS (IP, hash, PDF) | 0 contrats ; saison gérable hors flux |
| Génération PDF devis / convocation / 4 modèles CR | Contournement print / Word possible |
| `/documents` médiathèque | Maquette |
| Qualiopi data fill | Processus peut rester Excel/Word audit |
| Lien analytique placement ↔ évaluation sortie | Utile BPF/qualité, pas encaissement nov. |
| Inscription groupe école | Contournement : N × `/register` ou saisie admin |
| E-facturation **émission** | Hors périmètre ; réception via Acom à confirmer |
| Nettoyage branches mergées | Hygiène git |
| Réparation crons `pg_net` | Relances auto factures/charges : utile mais contournable manuellement si volumes factures encore bas |

---

## Recommandation motivée : bascule

### Recommandation : **bascule partielle par module**, pas totale « tout Excel off » au 1er octobre

**Ordre proposé :**

1. **Inscriptions + stagiaires + `/register` + tests placement** — déjà peuplés (906 / 631 / 596) → **bascule saisie nouvelle** dès que B3 (affichage niveau) et process delta sont OK.  
2. **Facturation + paiements + Stripe** — **uniquement après B1 + B2 + B4** ; jusqu’alors garder Excel compta comme référence numéros si besoin.  
3. **Portail stagiaire / invites** — utile mais non bloquant encaissement ; activer au fil de l’eau.  
4. **Formateurs / CR / phrases / sessions** — tables vides ; **rester manuel** nov.–janv. si B7 non fait.  
5. **Qualité Qualiopi / documents médiathèque / commercial leads** — **pas** dans le chemin critique saison.  
6. **Moniteurs / partners / outreach** — **lecture seule** ; **aucun envoi** sans validation Paula (B5).

**Pourquoi pas totale :** factures à 0, exercice fiscal faux, CECRL exposé aux stagiaires, phrases non importées, formateurs/sessions absents, crons cassés, et haute saison dans ~8 semaines sans marge de rollback structurel.

**Condition d’une bascule « inscriptions + factures » réussie au 1er octobre :** B1–B6 traités et validés par Paula sur un jeu d’essai (20 dossiers + 20 factures numérotées alignées Excel).

---

## Annexe — Inventaire volumes (snapshot 2026-09-09)

| Table | n |
|-------|--:|
| students | 631 |
| inscriptions | 906 |
| placement_tests | 596 |
| placement_test_questions | 0 |
| ski_monitors | 4047 |
| partners | 1032 |
| invoices | 0 |
| payments | 1 |
| test_phrases | 0 |
| test_evaluations | 0 |
| test_bookings | 0 |
| satisfaction_surveys | 0 |
| qualiopi_indicators | 0 |
| continuous_improvement | 0 |
| document_sendings | 0 |
| sessions | 0 |
| instructors | 0 |
| formation_costs | 0 |
| instructor_payments | 0 |
| instructor_contracts | 0 |
| course_intakes | 0 |
| intake_outreach_log | 0 |
| email_log | 0 |
| certificates | 0 |

---

*Fin de l’audit. Aucune modification applicative n’a été faite au-delà de l’ajout de ce fichier. Attente de validation Paula avant tout correctif.*
