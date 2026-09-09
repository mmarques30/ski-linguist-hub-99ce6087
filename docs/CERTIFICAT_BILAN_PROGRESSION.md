# Certificat de fin de formation — bilan Entrée / Sortie

**Branche :** `cursor/certificat-bilan-progression-7435`  
**Date :** 2026-09-09  
**Remplace :** le mapping « piste » comme libellé de certificat (point 4 partiel)

## Règle produit

Le certificat **ne porte jamais la piste comme niveau final**. Il porte un **bilan de progression** Entrée / Sortie sur deux niveaux.

## Contenu du PDF

- Stagiaire, formation (langue, dates, durée h, lieu/modalité), formateur·rice, FLI
- Tableau Entrée / Sortie :
  - **Niveau général** : entrée = piste placement (ou constat 1er cours) ; sortie = CECRL formateur
  - **Niveau technique / métier** : entrée = observation 1er cours ; sortie = CECRL formateur
- Objectif pédagogique atteint : oui / partiellement / non + commentaire libre
- Mention SNMSF obligatoire (texte exact dans `CERTIFICATE_SNMSF_DISCLAIMER`)
- Heures suivies / heures prévues, date, signature FLI
- **Jamais** d’évaluation SNMSF / test DSF dans ce document

## Données (`inscriptions`)

| Formulaire | Champs |
|------------|--------|
| Entrée | `niveau_general_entree`, `niveau_technique_entree`, `remarques_entree` |
| Sortie | `niveau_general_sortie`, `niveau_technique_sortie`, `objectif_atteint`, `commentaire_sortie` |

`entry_level` / `exit_level` restent synchronisés (deprecated) pour compatibilité.  
Mesure Qualiopi **PROC-026** = taux d’inscriptions terminées/facturées avec formulaire de sortie complet.

## Règles applicatives

1. Pas de certificat sans formulaire de sortie complet
2. Absence → « Documents manquants » sur la fiche inscription
3. PDF stocké (`documents` storage), `certificates.pdf_url`, visible portail stagiaire
4. Aucune donnée stagiaire en dur dans le template

## Fichiers clés

- `src/lib/certificate-progression.ts`
- `src/components/inscriptions/FormateurEntryFormDialog.tsx`
- `src/components/inscriptions/FormateurExitFormDialog.tsx`
- `src/components/endpack/CertificatePreview.tsx`
- `src/hooks/useEndPack.ts`
- `supabase/migrations/20260909180000_certificate_progression_bilan.sql`
