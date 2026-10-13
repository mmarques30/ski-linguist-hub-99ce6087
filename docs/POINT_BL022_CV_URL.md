# BL-022 — CV formateur·rices (`instructors.cv_url`)

**Date :** 2026-09-29  
**Statut :** **CADRÉ** (pas de reprise automatique Drive → Storage)

> **Confidentialité :** aucun nom de personne dans `docs/`. Inventaire nominatif →
> `/opt/cursor/artifacts/bl022-cv-inventory.log` uniquement.

## 1. Constat live (29/09)

| Métrique | n |
|----------|---|
| `instructors` | 72 |
| avec `cv_url` non vide | **16** |
| dont `drive.google.com/open?id=…` | **16** |
| URL Supabase Storage | **0** |
| Autre hôte | **0** |

Tous les liens suivent le même format importé (Point 3 / colonne CSV « CV (lien) »).

| Élément | État |
|---------|------|
| Affichage fiche formateur | Absent avant ce livrable (colonne importée seulement) |
| Téléchargement anonyme Drive | **Impossible** — `GET …/uc?export=download&id=…` renvoie une page HTML Google (login / consentement), pas un PDF |
| Buckets privés (A / A2) | Sans effet sur ces URL : ce ne sont pas des objets Storage |

## 2. Hors périmètre automatisé

Une reprise scriptée (agent / edge / cron) qui télécharge les 16 fichiers depuis
Google Drive **n’est pas faisable** sans compte Google FLI authentifié et droits
sur chaque fichier. Les liens ne sont pas publics.

Ne pas tenter un scrape Drive depuis ce dépôt.

## 3. Décision produit (cadrage)

| Option | Description | Choix |
|--------|-------------|-------|
| A | Laisser les liens Drive tels quels, sans UI | Rejeté — données mortes |
| B | Afficher / éditer le lien (Drive ou autre) sur la fiche Administratif | **Retenu** (immédiat) |
| C | Upload staff → bucket privé `documents`, chemin `staff/instructors/<id>/cv.pdf` ; `cv_url` = chemin | **Retenu** (chemin de rapatriement manuel) |
| D | Script bulk Drive → Storage | **Reporté** — nécessite accès Drive FLI hors agent |

Rapatriement des 16 CV existants = **action manuelle** (télécharger depuis le Drive
FLI, déposer via la fiche formateur). Pas de SLA agent.

## 4. Convention Storage

```
documents / staff/instructors/<instructor_id>/cv.pdf
```

- Bucket : `documents` (privé, Point A2)
- Lecture : `is_staff()` (RLS existante) ; téléchargement UI via URL signée
  (`CertificatePdfButton` / `sign-private-download`)
- Les URL `https://…` (Drive historiques) restent acceptées : ouverture directe
  (compte Google du staff)

## 5. Fichiers

- `src/lib/instructor-cv.ts` — chemin, détection Drive / URL externe
- `src/pages/formateurs/InstructorDetails.tsx` — carte CV (Administratif)
- `src/components/formateurs/InstructorFormDialog.tsx` — champ `cv_url`
- Import CSV inchangé (`admin-import-engine.ts` colonne « CV (lien) »)

## 6. Suite éventuelle (hors BL-022)

Si Paula fournit un export Drive ou un partage service-account : reprendre option D
avec journal `audit_log` et chemins `staff/instructors/…` uniquement — pas d’URL
publique.
