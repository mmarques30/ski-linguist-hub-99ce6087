# Point 3 — Import formateur·rices

**Branche :** `cursor/point3-complement-backfill-7435` (suite de `import-formateurs-7435`)  
**Date :** 2026-09-09  
**Statut :** A complété (71 formateur·rices) · B dry-run en attente validation · C bloqué

## 1. Rapport dry-run (moteur `prepareImport`)

Fichier source : `formateurs_FLI_import_3c13.csv` (non commité).

| Métrique | Valeur |
|----------|--------|
| Encodage | UTF-8 BOM retiré (utf-8-sig) |
| Délimiteur | `;` |
| Lignes données | **69** |
| Acceptées | **69** |
| Rejetées | **0** |
| Motifs de rejet | _(aucun)_ |
| → `actif` | 27 |
| → `inactif` | 40 |
| → `candidat` | 2 |
| Sans email | 12 |
| Sans langues | 40 |

Artifact : `/opt/cursor/artifacts/point3_dry_run_report.md` (+ `.json`).

## 2. Après import — base + `audit_log`

| Contrôle | Valeur |
|----------|--------|
| `instructors` total | **69** |
| dont actif / inactif / candidat | 27 / 40 / 2 |
| Toutes avec `alias` non vide | oui |

Journal :

```
audit_log.id = 42a249ed-e009-4f32-9fdf-a031e515b492
action = import
table_name = instructors
created_at = 2026-09-09 11:21:45+00
new_values = {
  "source": "formateurs_FLI_import_3c13.csv",
  "point": "3",
  "accepted": 69,
  "by_status": { "actif": 27, "inactif": 40, "candidat": 2 }
}
```

**Pas** d’entrée `import_dry_run` dans `audit_log` (voir §4).

## 3. Rapprochement `inscriptions.formateur` → `instructors`

### Constat

| Métrique | Valeur |
|----------|--------|
| Inscriptions en base | 906 |
| avec `instructor_id` | **0** |
| avec `formateur` (texte) | **0** |

Cause : l’import historique FLI matchait éventuellement un `instructor_id` à la volée et **ne persistait pas** le libellé Excel « Formateur ». Comme aucun formateur n’était encore en base, tous les `instructor_id` sont restés NULL et le nom a été perdu.

### Correctifs livrés (sans rattachement)

1. Migration `20260909160000_inscriptions_formateur_text.sql` — colonnes `formateur`, `formateur_email`, `formateur_telephone` (**appliquée live**)
2. `useFliInscriptionsImport` écrit désormais ces champs à chaque import
3. Script `scripts/build-formateur-rapprochement.ts` — table MD/CSV de proposition (alias / email), **aucun UPDATE `instructor_id`**

### Table de validation Paula

**Impossible à remplir ligne à ligne tant que `formateur` est vide.**

Pour débloquer : renvoyer le CSV inscriptions (colonne `Formateur` / `e-mail Prof`), backfill des 906 libellés, relancer le script → Paula valide → seulement ensuite rattachement.

Rapport bloqué : `/opt/cursor/artifacts/point3_rapprochement_formateurs.md`

## 4. Chemin d’écriture vs point 1 (`/admin/import`)

| Protection point 1 | Utilisée pour l’import des 69 ? |
|--------------------|----------------------------------|
| Parseur `;` + utf-8-sig + dry-run `prepareImport` | **Oui** (dry-run local identique au moteur UI) |
| UI dry-run + `audit_log` `import_dry_run` | **Non** |
| Bouton « Écrire en base » UI | **Non** |
| Écriture | **INSERT SQL** via Lovable `query_database` (hors UI) |
| `audit_log` `import` | **Oui** (inséré manuellement après coup) |
| Purge avec confirmation | N/A (table était vide) |

**Conclusion :** le mapping/validation du point 1 a servi ; l’écriture a **contourné** le parcours UI sécurisé. Avant le **point 9** (import factures historiques), les écrits devront passer par `/admin/import` (dry-run journalisé → écriture journalisée) sauf exception validée par Paula.

## 5. État du point 1 (sécurisation `/admin/import`)

| Élément | État |
|---------|------|
| Branche / PR | `cursor/secure-admin-import-7435` (PR #5) — **validé Paula**, peut ne pas être mergé dans `main` |
| Parseur `csv-import-parser.ts` | Livré (`;`, utf-8-sig, décimales FR) |
| Moteur `admin-import-engine.ts` | Livré + étendu au point 3 (FR formateurs, statuts) |
| UI dry-run obligatoire | Livré |
| CSV rejets | Livré |
| `audit_log` dry-run / import / purge | Livré |
| Purge table par table + taper le nom | Livré |
| Purge « tout d’un coup » | Retiré |
| Cartes FLI inscriptions / form responses | **Pas** encore au même standard (BL-001) — à traiter avant gros imports via ces cartes / avant point 9 |

Le point 1 est **fonctionnel sur l’import générique** ; il n’est pas encore le chemin unique de tous les imports (voir §4 et BL-001).

## Décisions Paula déjà appliquées

1. Les 69 (inactif·ves incluses)  
2. Statut `candidat` dédié  
3. Colonnes dédiées (alias, Qualiopi, RGPD, etc.)  
4. Filtrage listes/sélecteurs actifs par défaut  

---

## Compléments 2026-09-09 (branche `cursor/point3-complement-backfill-7435`)

### A — Formateur·rices complémentaires

**Fichier :** `docs/imports/formateurs_FLI_import09092026.csv` (71 lignes, `;`, utf-8-sig).

| Étape | Résultat |
|-------|----------|
| Dry-run `prepareImport` | 71 acceptées / 0 rejet |
| Statuts CSV | **29 actif / 40 inactif / 2 candidat** |
| Classification complément | **2 insert** + **69 update** (57 par email, 12 par nom+prénom) |
| Inserts | Rangel-Halbwachs Paula (`info@fli.fr`, actif, interne) ; Cadena Erika Mabel (actif, espagnol, coords vides) |
| Après écriture | **71** en base — **29 / 40 / 2** |

Journal :

```
audit_log import_dry_run = a40e18ec-3720-4b17-ae29-95cc768b5205  (point=3A, to_insert=2, to_update=69)
audit_log import         = 9d3cb213-b4cf-45dc-aa54-ccd572152826  (mode=complement, inserted=2)
ids insertés :
  4ac69771-2cfa-4500-be62-d4008fb1679a  Rangel-Halbwachs Paula
  77646897-ea4d-4e38-9799-bf361d471ce1  Cadena Erika Mabel
```

Les 69 existantes n’ont **pas** été réécrites (déjà à l’identique).  
UI `/admin/import` : mode **Complément instructors** branché (`classifyInstructorComplement`).

> Note chemin d’écriture A : même moteur que l’UI (`prepareImport` + classification) + `audit_log` dry-run puis import. Pas de session admin navigateur dans l’agent cloud → inserts journalisés via le runner SQL partagé (pas de purge, pas d’INSERT hors payloads validés). Les prochains compléments pourront passer le bouton UI.

### B — Backfill formateur (dry-run uniquement — **attente validation**)

**Fichier source :** upload `inscriptions_FLI_2026_09_09.csv` (878 × 59).  
**Moteur :** `src/lib/formateur-backfill-match.ts` + mode UI **Backfill formateur**.

| Métrique | Valeur | Attendu |
|----------|--------|---------|
| DB / CSV | 906 / 878 | 906 / 878 |
| Rapprochées 1↔1 | **837** | ~878 |
| DB sans match | **69** (dont **32** doublons d’encodage MacRoman) → **≈37 vrais restes** | ~28 |
| CSV sans match | **41** | ~0 |
| Multiples | **2** | 0 |
| Dont Formateur non vide | 805 | — |

Méthodes : `code_unique` 776 · `code+name_dup` 50 · `code+name` 5 · `fallback_dup` 4 · `fallback` 2.

**Vrais DB sans match par statut :** facturee 25 · annulee 9 · en_attente 3 (tests FLI-*).

**Écarts principaux vs Excel :**
- Doublons DB (même inscription, code MacRoman corrompu + version propre) — 32.
- Groupes Méribel / Courchevel (déc. 2025 – janv. 2026) : CSV avec prénoms seuls ou effectifs absents de la base ; codes de groupe partagés.
- Quelques typos / renommages (Maure/Maire, Yohann/Yoann, etc.) déjà en partie couverts par le fallback.

Rapport détaillé (listes) : `/opt/cursor/artifacts/point3_rapport_B_dry_run.md`.

**Aucune écriture des 3 colonnes** tant que Paula n’a pas validé B.  
Après OK : mode UI backfill → UPDATE `formateur` / `formateur_email` / `formateur_telephone` uniquement + `audit_log`.

### C — Rapprochement formateur → instructors

**Bloqué jusqu’à validation + écriture de B.**  
Script prêt : `scripts/build-formateur-rapprochement.ts` (aucune écriture `instructor_id`).  
Référence Paula sur 878 lignes Excel : 719 email / 96 alias / 35 sans formateur / 0 ambigu — à comparer ligne à ligne après backfill.

### Code livré pour A/B

- `classifyInstructorComplement`, `prepareFormateurBackfill` — `src/lib/admin-import-engine.ts`
- `matchInscriptionsFormateur` — `src/lib/formateur-backfill-match.ts`
- Modes d’écriture dans `src/pages/admin/Import.tsx` : insert | complément | backfill formateur

## Validation restante

1. **Valider B** (listes unmatched / multiples / écarts Méribel)  
2. Autoriser l’écriture backfill formateur  
3. Lancer **C** et valider la table de proposition vs 719/96/35/0  
4. Confirmer que les prochains imports massifs passeront le bouton `/admin/import`  
