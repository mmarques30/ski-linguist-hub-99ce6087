# ADR: Sistemas de Teste de Nível

## Contexto

O projeto FLI possui dois sistemas de avaliação de nível com propósitos distintos:

| Sistema | Tabelas | Uso |
|---------|---------|-----|
| **Teste de posicionamento (self-service)** | `placement_tests`, banque JSON `src/data/placement-questions/` | Inscription publique `/register` — teste adaptatif par pistes |
| **Avaliação formal (compte-rendu)** | `test_bookings`, `test_evaluations` | Interface formateur — avaliação presencial/online |

La table SQL `placement_test_questions` n’est **pas** utilisée par le test adaptatif.

## Teste adaptatif (FLI_Tests_Positionnement_2026 — banque 2026)

### Parcours

1. **Auto-diagnostic** (13 questions, conditions + multi-choix Q5 / Q7 max 3)
2. **Pistes adaptatives** — verte → bleue → rouge → noire (5 questions chacune)
3. Avec ≥ 3 bonnes réponses sur 5, la piste est validée et on passe à la suivante
4. Avec &lt; 3, la partie adaptative s’arrête
5. **Vocabulaire ski** — 5 questions pour **tous** les stagiaires (score séparé `vocabScore`, n’influence pas la piste), y compris si la noire est validée
6. **Présentation** (Q26) — texte libre facultatif, 1 000 caractères max, stocké dans `summary.presentationText`

### Niveau CEFR (back-office uniquement)

Déterminé par la piste la plus élevée validée (≥ 3/5) :
- Verte → A2 | Bleue → B1 | Rouge → B2 | Noire → C1 | Échec verte → A1 (affiche « Piste verte » au stagiaire — RG05)

### Échelle adaptée

Allemand, néerlandais, russe, chinois : verte = traduction, bleue = grammaire simple.
Mention « Échelle adaptée » en back-office uniquement (`hasAdaptedScale`).

### Affectation matin / après-midi

**Ne pas attribuer automatiquement** à l'inscription.

- `schedule_status` = `pending` à la création
- Validation manuelle par Paula ~10 jours avant le début des cours
- Analyse du groupe d'inscrits dans son ensemble
- Valeurs finales : `matin` | `apres-midi`

## Decisão

Manter os dois sistemas separados. O teste adaptatif alimenta `entry_level` e `placement_tests`. O horário é workflow de aprovação admin.

## Consequências

- Banque active : `FLI_Tests_Positionnement_2026.xlsx` → `src/data/placement-questions/`
- Archive de l’ancienne banque : `src/data/placement-questions/_archive/`
- UI admin : `ScheduleApprovalDialog` em `/inscriptions/:id`
- Email automatique J-10: edge function `process-schedule-reminders` (cron diário 08:00 UTC) → `info@fli.fr`
- Futura Onda 3: vista consolidada dos inscritos pendentes J-10 para decisão em lote
