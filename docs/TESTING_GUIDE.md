# Guia de Testes Completo - FLI Formation

## 📋 Índice
1. [Autenticação](#autenticação)
2. [Alunos](#alunos)
3. [Inscrições](#inscrições)
4. [Faturas](#faturas)
5. [Testes de Posicionamento](#testes-de-posicionamento)
6. [Avaliações (Compte-Rendu)](#avaliações)
7. [Satisfação](#satisfação)
8. [Finanças](#finanças)
9. [Relances Automáticas](#relances-automáticas)

---

## 🔐 Autenticação

### Teste de Login
1. Acesse `/auth`
2. Insira credenciais válidas
3. ✅ Deve redirecionar para Dashboard (`/`)

### Teste de Logout
1. Clique no botão de logout no Sidebar
2. ✅ Deve redirecionar para `/auth`

### Rota Protegida
1. Sem login, acesse `/inscriptions`
2. ✅ Deve redirecionar para `/auth`

---

## 👥 Alunos

### Criar Aluno
1. Vá para `/students`
2. Clique em "Novo Aluno"
3. Preencha: Nome, Email, Telefone
4. ✅ Aluno aparece na lista

### Visualizar Detalhes
1. Clique em um aluno
2. ✅ Mostra inscrições e estatísticas

---

## 📝 Inscrições

### Criar Inscrição
1. Vá para `/inscriptions`
2. Clique em "Nova Inscrição"
3. Preencha os passos do formulário
4. ✅ Inscrição criada com código automático

### Editar Status
1. Clique em uma inscrição
2. Altere o status
3. ✅ Status atualizado

---

## 💰 Faturas

### Criar Fatura
1. Vá para `/invoices`
2. Clique em "Nova Fatura"
3. Selecione inscrição, valor, tipo
4. ✅ Fatura criada com número automático

### Testar Filtros
1. Filtre por status (Brouillon, Envoyée, Payée)
2. ✅ Lista atualiza corretamente

### Editar Fatura
1. Clique em uma fatura
2. Edite os dados
3. ✅ Alterações salvas

---

## 📊 Testes de Posicionamento

### Visualizar Testes
1. Vá para `/tests`
2. ✅ Lista de testes com links públicos

### Inscrição Pública
1. Acesse `/register`
2. Preencha todas as etapas incluindo teste de 20 questões
3. ✅ Inscrição salva com código FLI e aparece em `/inscriptions`

---

## 📝 Avaliações (Compte-Rendu)

### Criar Avaliação
1. Vá para `/formateur/evaluations`
2. Selecione um teste pendente
3. Preencha scores e apreciações
4. ✅ Avaliação salva

### Visualizar PDF
1. Clique em "Voir CR"
2. ✅ PDF gerado corretamente

---

## 😊 Satisfação

### Ver Estatísticas
1. Vá para `/satisfaction-stats`
2. ✅ Mostra gráficos e médias

### Gerar QR Code
1. Clique em "Générer QR"
2. ✅ QR Code para pesquisa

---

## 💹 Finanças

### Dashboard Financeiro
1. Vá para `/finance`
2. ✅ KPIs atualizados

### Charges Fixes
1. Vá para `/finance/charges-fixes`
2. Visualize aba "Tableau de bord"
3. ✅ Mostra impayés e progressão

### Rentabilidade
1. Vá para `/finance/rentabilite`
2. ✅ Análise por formação

---

## 📧 Relances Automáticas

### Teste Dry-Run (sem enviar emails)

#### Via Terminal:
```bash
curl -X POST "https://nghkrmvakjomzmfwdhbo.supabase.co/functions/v1/process-invoice-reminders?dry_run=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naGtybXZha2pvbXptZndkaGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDIzMjUsImV4cCI6MjA4MzUxODMyNX0.mgAmQpO28Au607Hu3TMjTErQaTvRijbD98WEs954qBU"
```

#### Resposta esperada:
```json
{
  "success": true,
  "results": {
    "dryRun": true,
    "totalOverdue": 5,
    "reminder1Sent": 2,
    "reminder2Sent": 1,
    "reminder3Sent": 0,
    "skipped": 2,
    "details": [
      {
        "invoiceNumber": "2025.14243",
        "email": "aluno@email.com",
        "daysOverdue": 10,
        "reminderLevel": 1,
        "action": "WOULD SEND Reminder 1"
      }
    ]
  },
  "summary": "[DRY-RUN] Would send 2 first, 1 second, 0 final reminders"
}
```

### Preparar Dados de Teste

1. **Criar fatura de teste com vencimento no passado:**
```sql
-- No Cloud > Database, execute:
UPDATE invoices 
SET due_date = CURRENT_DATE - INTERVAL '10 days',
    status = 'sent'
WHERE id = 'SEU_INVOICE_ID';
```

2. **Verificar faturas em atraso:**
```sql
SELECT 
  invoice_number,
  due_date,
  status,
  CURRENT_DATE - due_date::date as days_overdue,
  reminder_1_sent_at,
  reminder_2_sent_at,
  reminder_3_sent_at
FROM invoices 
WHERE status IN ('draft', 'sent') 
  AND due_date < CURRENT_DATE
ORDER BY due_date;
```

### Níveis de Relance

| Dias em atraso | Nível | Assunto |
|---------------|-------|---------|
| 7-14 dias | 1 | "Rappel de paiement" |
| 15-29 dias | 2 | "Second rappel de paiement" |
| 30+ dias | 3 | "URGENT - Mise en demeure" |

---

## 🔄 Fluxo Completo de Teste

1. ✅ Login
2. ✅ Criar aluno
3. ✅ Criar inscrição
4. ✅ Criar fatura
5. ✅ Testar dry-run de relances
6. ✅ Verificar dashboard financeiro
7. ✅ Logout

---

## 📝 Checklist Rápido

- [ ] Autenticação funciona
- [ ] CRUD de alunos ok
- [ ] CRUD de inscrições ok
- [ ] CRUD de faturas ok
- [ ] Filtros funcionam
- [ ] Dashboard atualiza
- [ ] Edge function responde
- [ ] Dry-run mostra detalhes
- [ ] Logs aparecem corretamente
