# Point 3 — Import formateur·rices

**Branche :** `cursor/import-formateurs-7435` (basée sur point 1)  
**Date :** 2026-09-09  
**Statut :** en attente de validation Paula (données **écrites**)  
**Fichier source :** `formateurs_FLI_import_3c13.csv` (upload agent — **non commité**, données perso)

## Décisions Paula (2026-09-09)

1. Importer les **69** (dont 40 inactif·ves) — nécessaires au rattachement historique / BPF  
2. Statut dédié **`candidat`** — trois valeurs : `actif` | `inactif` | `candidat` ; passage candidat→actif = action explicite Paula  
3. **Colonnes dédiées** pour tous les champs (pas de perte en `status_notes`)

## Migration

Fichier : `supabase/migrations/20260909150000_instructors_candidat_and_columns.sql` (réversible, section DOWN)  
**Appliquée en live** le 2026-09-09.

### Statut

CHECK remplacé : `actif` | `inactif` | `candidat` (suppression de `ACTIF`/`INACTIF`/`A_EVITER`).  
`is_active` synchronisé : `true` seulement si `status = 'actif'`.

### Colonnes ajoutées

| Colonne | Type | Usage |
|---------|------|--------|
| `alias` | `text[]` | Rapprochement `inscriptions.formateur` / CSV facturation |
| `civilite` | `text` | Civilité |
| `pays` | `text` | Pays |
| `statut_administratif` | `text` | Qualiopi indicateur 27 |
| `identifiant_etranger` | `text` | Qualiopi 27 (hors SIRET) |
| `assujetti_tva` | `boolean` | Sous-traitance / TVA |
| `consentement_temoignage` | `text` | RGPD : `oui` \| `oui avec relecture` \| `non` \| NULL |
| `consentement_photo` | `text` | idem |
| `cv_url` | `text` | Dossier formateur |
| `formulaire_2026` | `boolean` | Formulaire saison |
| `date_naissance` | `date` | Dossier formateur |

`siret` existait déjà.

## Mapping / UI

- En-têtes FR acceptés dans `admin-import-engine.ts`
- Liste `/formateurs` : filtre statut **défaut = actif** (consultable : inactif / candidat / tous)
- Sélecteurs d’affectation (inscriptions, sessions, coûts) : `status = 'actif'` uniquement
- Cartes : badge de statut

## Import effectué

| Statut | Lignes |
|--------|--------|
| actif | 27 |
| inactif | 40 |
| candidat | 2 |
| **total** | **69** |

- Toutes les lignes ont au moins un `alias` (variantes CSV + « Prénom Nom »)
- Journal `audit_log` : `action = import`, `table_name = instructors`, source CSV point 3
- CSV source **non** versionné dans git

## Hors scope (volontaire)

- Module recrutement candidat (parcours formulaire / observation / cours d’essai)
- Action UI « passer candidat → actif » (à faire quand le module recrutement démarre — en attendant : update SQL / fiche)
- Liaison auto aux inscriptions historiques (prochain rapprochement)
- Colonne `inscriptions.formateur` texte (si absente) — pour le matching futur

## Validation demandée

Paula, merci de confirmer :

1. Les 69 en base (27/40/2) OK  
2. Colonnes + consentements OK  
3. Filtrage listes/sélecteurs OK  
4. On peut enchaîner sur le **point 4** (CECRL hors UI stagiaire)  
