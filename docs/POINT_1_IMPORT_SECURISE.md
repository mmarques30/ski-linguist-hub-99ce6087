# Point 1 — Import admin sécurisé

**Branche :** `cursor/secure-admin-import-7435`  
**Date :** 2026-09-09  
**Statut :** validé Paula 2026-09-09 — **à merger / à respecter avant point 9**

## Objectif

Sécuriser `/admin/import` avant tout nouvel import (formateur·rices, factures, etc.).

## Fait

### Parseur (`src/lib/csv-import-parser.ts`)

- Délimiteur **`;`**
- Encodage **UTF-8** avec retrait BOM (**utf-8-sig**)
- Décimales **virgule** ; milliers avec espace / `\u00a0` / `\u202f` retirés (`parseFrenchNumber`)
- Champs entre guillemets (y compris multilignes)
- Export CSV des rejets avec BOM UTF-8

### Moteur (`src/lib/admin-import-engine.ts`)

- Validation ligne à ligne sans écriture
- Mapping tables : `instructors`, `ski_schools`, `students`, `inscriptions`, `invoices`
- TVA factures : formation 0 %, test / sous-traitance 20 % (rejet sinon)
- Étendu au point 3 : en-têtes FR formateur·rices, statuts `actif|inactif|candidat`, colonnes dédiées

### UI (`src/pages/admin/Import.tsx`)

1. **Comptes live** par table (refresh)
2. **Dry-run obligatoire** avant « Écrire en base »
   - Acceptées / rejetées + 20 premières erreurs
   - Journal `audit_log` action `import_dry_run`
3. **Rapport rejets** téléchargeable (CSV `;`)
4. **Écriture** journalisée (`action = import`)
5. **Purge table par table** uniquement
   - Affiche nom de table + nombre de lignes
   - Exige de **taper le nom exact** de la table
   - Journal `audit_log` action `purge`

### Retiré

- Bouton « Purger toutes les données » (4 tables d’un coup)

## Écart constaté à l’usage (point 3)

L’écriture des 69 formateur·rices a utilisé le dry-run du moteur, puis un **INSERT SQL hors UI** (Lovable `query_database`), avec `audit_log` `import` ajouté ensuite.  
Donc : protections de **validation** OK ; parcours UI d’écriture / `import_dry_run` **non** emprunté.

**Règle pour la suite (notamment point 9) :** imports massifs via `/admin/import` (dry-run journalisé → écriture journalisée), sauf exception écrite Paula.

## Non couvert (BL-001)

Cartes `FliInscriptionsImportCard` / `FliFormResponsesImportCard` : pas encore le même dry-run / journal / CSV rejets.

## Preuves

Voir aussi `docs/POINT_3_IMPORT_FORMATEURS.md` §4–5.
