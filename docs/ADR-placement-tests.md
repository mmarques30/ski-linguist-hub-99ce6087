# ADR: Sistemas de Teste de Nível

## Contexto

O projeto FLI possui dois sistemas de avaliação de nível com propósitos distintos:

| Sistema | Tabelas | Uso |
|---------|---------|-----|
| **Teste de posicionamento (self-service)** | `placement_tests`, `placement_test_questions` | Inscrição pública `/register` — 20 questões MCQ, define criativo MANHÃ/TARDE |
| **Avaliação formal (compte-rendu)** | `test_bookings`, `test_evaluations` | Interface formateur — avaliação presencial/online com frases e critérios |

## Decisão

**Manter os dois sistemas separados** com papéis distintos:

1. **Placement test** — triagem automática na inscrição (Entregas 5-6 do guia business)
2. **Compte-rendu** — avaliação pedagógica formal pelo professor (Entrega 9)

## Integração

- Resultado do placement test → `inscriptions.entry_level`, `schedule`, `entry_test_score`
- Compte-rendu → `inscriptions.exit_level`, certificados, End Pack
- Não unificar tabelas — domínios e workflows diferentes

## Consequências

- Admin deve entender que `/tests` gerencia links públicos, enquanto `/formateur/evaluations` gerencia avaliações formais
- Futura Onda 3 usará `schedule` (matin/apres-midi) do placement test para alocação de turmas
