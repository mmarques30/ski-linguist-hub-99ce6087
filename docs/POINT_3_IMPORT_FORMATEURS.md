# Point 3 — Import formateur·rices

**Branche :** `cursor/import-formateurs-7435` (basée sur point 1)  
**Date :** 2026-09-09  
**Statut :** en attente de validation Paula (dry-run OK — **aucune écriture DB**)  
**Fichier source :** `formateurs_FLI_import_3c13.csv` (upload agent — **non commité**, données perso)

## Objectif

Importer le fichier formateur·rices via `/admin/import` sécurisé (point 1), avec mapping des en-têtes français et statuts compatibles CHECK DB.

## Fait (code)

### Mapping (`src/lib/admin-import-engine.ts`)

- En-têtes FR/EN (accents ignorés) : Nom, Prénom, Email, Téléphone, Langues, Statut, SIRET, Adresse, CP, Ville, etc.
- **Statuts DB** (contrainte `instructors_status_check`) : `ACTIF` | `INACTIF` | `A_EVITER`
  - Correctif : l’ancien mapping écrivait `active`/`inactive` → **rejeté** par le CHECK
  - `candidat` → `INACTIF` + note explicite (pas de valeur CHECK `CANDIDAT`)
- Champs hors schéma (civilité, pays, date de naissance, CV, formulaire 2026, consentements, identifiant étranger…) → lignes dans `status_notes`
- `Alias` → aussi `specialty_details`
- `Statut administratif` → `tax_status` (tronqué 120 car.) + note
- Email vide → `null` (UNIQUE email OK pour plusieurs NULL)
- **Pas** de liaison automatique aux inscriptions

### UI

Aide contextuelle sur `/admin/import` quand la table `instructors` est sélectionnée.

## Dry-run (fichier Paula, 2026-09-09)

| Métrique | Valeur |
|----------|--------|
| Lignes | 69 |
| Acceptées | **69** |
| Rejetées | **0** |
| BOM | UTF-8 retiré |
| ACTIF | 27 |
| INACTIF | 42 (dont 2 candidats mappés) |
| Sans email | 12 (surtout inactifs) |
| Sans langues | 40 (surtout inactifs) |

Candidats mappés INACTIF + note : Langer Dominique, Resende Carolina.

**Table `instructors` en base :** 0 ligne — aucune écriture effectuée.

## Décisions demandées avant écriture

1. **Périmètre** : importer les **69** lignes, ou **actifs seulement** (27), ou actifs + candidats ?
2. **`candidat`** : garder le mapping INACTIF + note, ou migration CHECK pour ajouter `CANDIDAT` ?
3. **Colonnes hors schéma** (civilité, pays, DOB, consentements, CV…) : OK en `status_notes` pour le cutover, ou colonnes dédiées plus tard (BL-003 élargi) ?
4. Confirmation écrite : **« OK pour écrire les formateur·rices en base »** (sinon on reste en dry-run).

## Hors scope

- Lien auto formateur ↔ inscriptions / missions
- Purge de `instructors` (table déjà vide)
- Commit du CSV source (données personnelles)

## Validation demandée

Paula, merci de répondre aux 4 décisions ci-dessus. Dès ton OK écriture, on lance l’import via l’UI sécurisée (ou SQL batch équivalent journalisé) sur la table vide.
