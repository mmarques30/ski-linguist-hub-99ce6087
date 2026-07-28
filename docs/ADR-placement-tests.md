# ADR: Sistemas de Teste de Nível

## Contexto

O projeto FLI possui dois sistemas de avaliação de nível com propósitos distintos:

| Sistema | Tabelas | Uso |
|---------|---------|-----|
| **Teste de posicionamento (self-service)** | `placement_tests`, `placement_test_questions` | Inscrição pública `/register` — teste adaptatif par pistes |
| **Avaliação formal (compte-rendu)** | `test_bookings`, `test_evaluations` | Interface formateur — avaliação presencial/online |

## Teste adaptatif (documentação FLI 2026)

### Parcours par pistes

1. **Piste verte** — 5 questions de grammaire
2. Si ≥ 3 bonnes réponses → **Piste bleue** (5 questions)
3. Si < 3 → **Vocabulaire ski** (5 questions) → fin du test
4. Même logique pour bleue → rouge → noire
5. Si échec sur une piste intermédiaire → vocabulaire ski

### Niveau CEFR

Déterminé par la piste la plus élevée validée (≥ 3/5) :
- Verte → A2 | Bleue → B1 | Rouge → B2 | Noire → C1 | Échec verte → A1

### Affectation matin / après-midi

**Ne pas attribuer automatiquement** à l'inscription.

- `schedule_status` = `pending` à la création
- Validation manuelle par Paula ~10 jours avant le début des cours
- Analyse du groupe d'inscrits dans son ensemble
- Valeurs finales : `matin` | `apres-midi`

## Decisão

Manter os dois sistemas separados. O teste adaptatif alimenta `entry_level` e `placement_tests`. O horário é workflow de aprovação admin.

## Consequências

- Questões importadas de `FLI_Tests_Complet_CORRIGE.xlsx` em `src/data/placement-questions/`
- UI admin: `ScheduleApprovalDialog` em `/inscriptions/:id`
- Email automático J-10: edge function `process-schedule-reminders` (cron diário 08:00 UTC) → `info@fli.fr`
- Futura Onda 3: vista consolidada dos inscritos pendentes J-10 para decisão em lote
