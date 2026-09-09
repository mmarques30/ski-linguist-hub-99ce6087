# Point 4 — Pistes pour le stagiaire, CECRL pour moniteur / DSF

**Branche :** `cursor/placement-piste-only-student-7435`  
**Date :** 2026-09-09  
**Statut :** prêt validation Paula (BL-018 certificats → pistes)

## Règle

| Audience | Affichage |
|----------|-----------|
| Stagiaire (`/register`, portail, preview alignée) | **Pistes** uniquement |
| Moniteur, DSF, admin, pricing, DB, endpack staff | **CECRL** conservé |

## Helpers (`src/lib/placement-test-engine.ts`)

- `studentFacingPisteLabel` / `studentFacingPisteFromCecrl` / `pisteLabelFromPlacementAnswers`
- `studentFacingCertificateLabel` — CECRL → piste ; sinon omit (jamais A1–C2 brut)
- `determineLevelFromSlopes` inchangé (back-office)

## Surfaces stagiaire

| Écran | Affichage |
|-------|-----------|
| PlacementTestStep / ConfirmationStep | Piste |
| StudentDashboard / StudentTest | Piste |
| StudentDocuments certificats | Piste ou « Certificat » |
| StudentPortalPreview (tests + certificats) | Aligné stagiaire |
| Placeholder format perso | sans code B2 |

## Conservé CECRL (voulu)

- PlacementTestSummaryCard admin
- Endpack / CertificatePreview staff
- Pricing, sessions, inscriptions admin
- Persistence `determined_level` / `entry_level` / `level_achieved` en base

## Tests

`npx vitest run src/lib/placement-test-engine.test.ts` — garde anti A1–C2 + certificats.

## Validation demandée

1. Register + portail : zéro A1–C2 côté stagiaire  
2. Admin / moniteur : CECRL intact  
3. Certificats : piste OK (décision prise : option b)  
4. OK point 5  
