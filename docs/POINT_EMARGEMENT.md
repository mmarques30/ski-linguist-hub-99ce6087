# Fiches de présence — process actuel (2026-10)

Statut : **PDF depuis le BO** (modèles Word 2025).  
Le flux numérique (lien `/emarger`, portail formateur, contre-signature en ligne) est **différé** tant que l’espace formateur n’est pas prêt pour la production.

## Process métier (validé Paula)

1. Générer les fiches préremplies depuis l’inscription (BO → onglet Documents).
2. **À chaque cours** : signature manuscrite sur la feuille (formateur et/ou stagiaire).
3. **Fin des séances** : envoi des feuilles signées à FLI.
4. Contre-signature / archivage côté responsable pédagogique (hors app pour l’instant).

## Modèles de référence

Copies des `.dotx` utilisés jusqu’ici :

- `docs/presence-fiches/Fiche_de_presence_FORMATEUR_2025.dotx`
- `docs/presence-fiches/Fiche_de_presence_STAGIAIRE_2025.dotx`

Champs : `Langue`, `Date_début`, `Date_fin`, `Durée_en_heures`, `Nom_et_Prénom`, `Formateur`, `CP` / `Ville` (stagiaire), grille date + durée h + signature.

## Livré dans l’app

| Élément | Détail |
|---------|--------|
| Génération PDF | `src/lib/presence-fiches-pdf.ts` — 2 variantes FORMATEUR / STAGIAIRE |
| En-tête | Logo FLI (`public/presence-fiches/fli-header-logo.png`, modèle Word) |
| Pied de page | Mentions légales FLI (Formation Professionnelle Continue / SIRET / n° OF) |
| UI | `PresenceFichesCard` sur `/inscriptions/:id` → Documents |
| Tests | `src/lib/presence-fiches-pdf.test.ts` |

## Différé (ne pas exposer pour cette formation)

- Page publique `/emarger/:token`
- Écran formateur `/formateur/emargement`
- Contre-signature admin `/emargement`
- Tables `attendance_slots` / `attendance_records` (migration déjà posée en base, inutilisée côté UI)

Reprise possible plus tard quand le portail formateur sera opérationnel.
