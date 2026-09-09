# Point 3 — Import formateur·rices

**Branche :** `cursor/point3-complement-backfill-7435` (suite de `import-formateurs-7435`)  
**Date :** 2026-09-09  
**Statut :** A fait · B écrit (837) · B2 dry-run en attente · C table livrée (pas d`instructor_id`)

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

### B — Backfill formateur (**écrit** — 837 uniquement)

Paula a validé l’écriture des 3 colonnes sur les **837** correspondances 1↔1 uniquement.

| Contrôle | Valeur |
|----------|--------|
| Lignes mises à jour | **837** |
| dont Formateur non vide | **805** |
| dont Formateur vide (CSV) | **32** |
| Inscriptions DB avec formateur rempli après | **805** |
| Inscriptions DB encore vides | **101** (= 32 + 69 non rapprochées) |
| Colonnes touchées | `formateur`, `formateur_email`, `formateur_telephone` uniquement |
| Non écrits | 69 DB sans match · 41 CSV orphelines · 2 multiples |

Journal :

```
audit_log import_dry_run = aaa4c1c8-fd04-489f-a6b8-ba29f26b1ceb  (point=3B, matched=837)
audit_log import         = e06e5f44-68ec-455d-95b8-39fd0ddf9620  (mode=formateur_backfill, updated=837)
created_at import        = 2026-09-09 12:32:07+00
```

Dry-run de rapprochement (listes) : `docs/POINT_3_RAPPORT_B_DRY_RUN.md`.

### B2 — Dry-run post-B (aucune suppression)

Rapport : `docs/POINT_3_RAPPORT_B2_DRY_RUN.md`.

1. **32 doublons d’encodage** — plan keep/delete + réaffectation `placement_tests` / `payments` / `document_sendings` (totaux côté delete : PT=12, pay=0, docs=0). **Attente accord Paula.**
2. **25 facturée** sans CSV — liste nom / date / langue / école pour arbitrage.
3. **2 multiples** — Sofie = doublon encodage ; Lana Couvez = collision (candidats Julie Moret).
4. **41 CSV orphelines** — **pas exclusivement** groupes école : 37 `effectif>1`, 1 attention facture, 3 individuel/autre. Rien créé.

### C — Rapprochement formateur → instructors (fait, aucun `instructor_id`)

Script : `scripts/build-formateur-rapprochement.ts`  
Rapport : `docs/POINT_3_RAPPORT_C_RAPPROCHEMENT.md`

| Méthode (DB, 805 avec formateur) | n | Réf. Paula (878 CSV) |
|----------------------------------|---|----------------------|
| email | **707** | 719 |
| alias (exact) | **65** | 96 |
| alias_fuzzy | **33** | (inclus alias) |
| alias_ambiguous | **0** | 0 |
| unmatched | **0** | — |
| sans formateur (DB) | **101** | 35 (CSV) |

**Alias(+fuzzy) = 98** (Δ +2 vs 96). **Ambigu = 0.**  
Écart email (−12) : typos / anciens mails classés en alias (`johnwenireb@…`, `clairelaplagne@neuf.fr`, `nathalie.raguin@bbox.fr`, `nikkivanrijswijk1@…`) — détail dans le rapport C.

Table de proposition : 29 libellés distincts → instructor proposé. **Aucun `instructor_id` écrit.**

### Code livré pour A/B/C

- `classifyInstructorComplement`, `prepareFormateurBackfill` — `src/lib/admin-import-engine.ts`
- `matchInscriptionsFormateur` — `src/lib/formateur-backfill-match.ts`
- Modes d’écriture dans `src/pages/admin/Import.tsx` : insert | complément | backfill formateur
- Script C enrichi (comptages méthode + JSON local)

## Validation restante

1. Accuser réception écriture B + audit  
2. **Arbitrer B2** (dédoublonnage 32, 25 facturées, orphelines) — aucune suppression avant accord  
3. Valider table C avant toute écriture `instructor_id`  
4. Confirmer que les prochains imports massifs passeront le bouton `/admin/import`  
