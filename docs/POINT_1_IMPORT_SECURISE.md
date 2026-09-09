# Point 1 — Import admin sécurisé

**Branche :** `cursor/secure-admin-import-7435`  
**Date :** 2026-09-09  
**Statut :** en attente de validation Paula

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

### UI (`src/pages/admin/Import.tsx`)

1. **Comptes live** par table (refresh)
2. **Dry-run obligatoire** avant « Écrire en base »
   - Affiche acceptées / rejetées
   - Affiche les **20 premières erreurs**
   - Journal `audit_log` action `import_dry_run` (fichier, totaux, 20 erreurs)
3. **Rapport rejets** téléchargeable (CSV `;`, colonne motif)
4. **Écriture** journalisée (`action = import`)
5. **Purge table par table** uniquement
   - Affiche **nom de table** + **nombre de lignes**
   - Exige de **taper le nom exact** de la table
   - Journal `audit_log` action `purge` (count before / deleted)

### Documentation

- `docs/BACKLOG.md` créé (écarts hors point 1)
- Le bouton « Purger toutes les données » (4 tables d’un coup, sans compte) a été **retiré**

## Non fait dans ce point (volontaire)

- Correction des libellés `entry_level` « Faux d�butant » en base → **après** ta validation du parseur (BL-002)
- Harmonisation des cartes FLI inscriptions / form responses (BL-001)
- Colonne `date_entree` formateur·rices (BL-003) — date mise dans `status_notes` en attendant

## Preuves à valider par toi

1. Ouvrir `/admin/import` connectée admin.
2. Vérifier les volumes affichés (doit coller à la base).
3. Déposer un petit CSV `;` UTF-8 sur `instructors` (ou autre table de test **vide** si tu ne veux rien écrire).
4. Lancer **dry-run** → accepter / rejeter + 20 erreurs si échecs.
5. Télécharger le CSV de rejets si rejets > 0.
6. **Ne pas** écrire / purger de données réelles sans ton accord explicite.
7. Optionnel lecture SQL :

```sql
SELECT action, table_name, new_values, created_at
FROM audit_log
WHERE action IN ('import_dry_run', 'import', 'purge')
ORDER BY created_at DESC
LIMIT 20;
```

## Comment tester le parseur hors UI

Fichier de smoke-test local (à lancer après `npm i` si besoin) :

```bash
node --input-type=module -e "
import { parseCsvText, parseFrenchNumber } from './src/lib/csv-import-parser.ts';
const sample = '\uFEFFNom;Montant\nDupont;1\u00a0234,56\n';
console.log(parseCsvText(sample));
console.log(parseFrenchNumber('1\u00a0234,56'));
"
```

(Si le runtime Node refuse le `.ts` sans loader, valider via l’UI dry-run.)

## Prochaine étape après validation

Point 2 — numérotation factures / exercice fiscal (nouvelle branche).
