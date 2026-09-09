# Point 4 — Pistes pour le stagiaire, CECRL pour moniteur / DSF

**Branche :** `cursor/placement-piste-only-student-7435`  
**Date :** 2026-09-09  
**Statut :** en attente de validation Paula  
**Dépendance :** point 3 validé (compléments rapport / rapprochement documentés à part)

## Règle

| Audience | Affichage |
|----------|-----------|
| Stagiaire (`/register`, portail étudiant) | **Pistes** uniquement (verte / bleue / rouge / noire / vocabulaire ski / début de parcours) |
| Moniteur, DSF, admin, pricing, DB | **CECRL** conservé (`determined_level`, `entry_level`, évaluations, endpack) |

## Fait

### Helpers (`src/lib/placement-test-engine.ts`)

- `studentFacingPisteLabel` — à partir de `passedSlopes` / `highestSlopeReached` / `endedAtVocab`
- `studentFacingPisteFromCecrl` — reverse map si seul le code CECRL est dispo (A1 → « Début de parcours »)
- `pisteLabelFromPlacementAnswers` — lit `answers.summary` des `placement_tests`
- `determineLevelFromSlopes` **inchangé** (CECRL pour le back-office)

### UI stagiaire

| Écran | Avant | Après |
|-------|-------|-------|
| `PlacementTestStep` résultat | Badge CECRL | « Piste atteinte » |
| Intro test | mention « CEFR » | retirée |
| `ConfirmationStep` | `currentLevel` CECRL | piste via `testSummary` |
| `StudentDashboard` | `entry_level` / `determined_level` | piste |
| `StudentTest` | `determined_level` | piste |
| Placeholder format perso | « certification B2 » | « certification » |

### Non modifié (volontaire)

- Cartes admin inscription / PlacementTestSummaryCard (CECRL OK)
- Formulaire évaluation formateur / endpack certificat staff
- Certificats portail `level_achieved` (souvent CECRL de fin de stage DSF) — **à trancher** si tu veux aussi les masquer
- Edge `submit-registration` (persiste toujours le CECRL)

## Tests

Vitest : `studentFacingPisteLabel` / `studentFacingPisteFromCecrl` dans `placement-test-engine.test.ts`.

## Validation demandée

1. UI register + portail : plus aucun A1–C2 visible au stagiaire  
2. Admin / moniteur : CECRL toujours visible  
3. Certificats stagiaire : garder CECRL ou passer en piste / libellé neutre ?  
4. OK pour enchaîner point 5 (geler outreach)  
