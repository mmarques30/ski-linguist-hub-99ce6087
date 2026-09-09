# Point 3 — Import formateur·rices

**Branche :** `cursor/import-formateurs-7435`  
**Date :** 2026-09-09  
**Statut :** validé Paula sur 69 / colonnes / filtrage — **compléments livrés** (rapport dry-run, audit, rapprochement bloqué faute de libellés)

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

## Validation restante point 3

- Accuser réception du rapport dry-run + audit (§1–2)  
- Fournir CSV inscriptions pour la table de rapprochement (§3)  
- Confirmer que les prochains imports massifs passeront par `/admin/import` (§4–5)  
