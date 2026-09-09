# Point 4 — Pistes pour le stagiaire, CECRL pour moniteur / DSF

**Branche :** fusionnée dans `cursor/certificat-bilan-progression-7435`  
**Date :** 2026-09-09  
**Statut :** UI pistes stagiaire OK ; **certificats** → voir bilan Entrée/Sortie (spec remplacée)

## Règle

| Audience | Affichage |
|----------|-----------|
| Stagiaire (`/register`, portail, preview) | **Pistes** (placement / tests) |
| Moniteur, DSF, admin | **CECRL** conservé |
| Certificat de fin de formation | **Bilan Entrée/Sortie** — jamais piste comme niveau final (`docs/CERTIFICAT_BILAN_PROGRESSION.md`) |

## Helpers

- `studentFacingPisteLabel` / `studentFacingPisteFromCecrl` / `pisteLabelFromPlacementAnswers`
- `studentFacingCertificateLabel` — **deprecated** (ne plus utiliser pour certificats)

## Surfaces stagiaire

| Écran | Affichage |
|-------|-----------|
| Placement / Confirmation / StudentTest | Piste |
| StudentDocuments certificats | « Certificat de fin de formation » + PDF bilan |
| Endpack staff | Bilan (formulaire sortie obligatoire) |
