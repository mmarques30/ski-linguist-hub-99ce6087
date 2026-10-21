# Prompt para o Cursor — correções de segurança (scan Lovable 14/10/2026)

Copie o bloco abaixo e cole no Cursor.

```text
PROJETO FLI Formation (Vite + React + Supabase/Lovable Cloud). Trabalhe numa branch nova
cursor/security-scan-2026-10-14 a partir de origin/main. Respeite AGENTS.md (copias
src/lib <-> supabase/functions/_shared + teste de drift; nao mexer em docs/BACKLOG.md
nem docs/ETAT_APP_*.md; merge origin/main antes de entregar). NAO enviar e-mail,
NAO ligar cron, NAO alterar secrets. Sem casts "as any" / "as unknown as".

0) PRE-REQUISITO — trazer para o GitHub a correcao feita so no Lovable:
   supabase/functions/_shared/admin-auth.ts
   - isServiceRoleToken: igualdade estrita em tempo constante com
     SUPABASE_SERVICE_ROLE_KEY. NUNCA confiar no claim "role" decodificado do JWT
     (JWT forjado nao assinado era aceito).
   - isValidCronDispatchToken: header x-cron-dispatch-token comparado em tempo
     constante com public.cron_dispatch_secret.token (min 32 chars); token errado -> 403.
   - Teste em src/lib/edge-cron-auth.test.ts (JWT forjado role=service_role -> recusado).
   Migration ja aplicada em prod (nao recriar): cron_dispatch_token_no_vault
   (tabela cron_dispatch_secret + dispatch_edge_function sem Vault). Apenas
   adicionar o arquivo de migration ao repo se faltar.

1) Login de administrador de teste (PRIORIDADE)
   - Procurar contas/credenciais de teste admin no repo (scripts/sql/zztest_roles_logins.sql,
     docs/TESTING_GUIDE.md, /admin/testing, .env, seeds) e qualquer senha em claro.
   - Remover senhas do repo; documentar que a conta deve ser desativada ou ter a senha
     trocada em prod (listar o e-mail encontrado no relatorio, nao a senha).

2) Retorno do pagamento (verify-registration-checkout)
   - Manter a revalidacao da sessao no Stripe (status paid + payment_status paid).
   - Exigir que session.metadata.inscription_id corresponda a uma inscricao existente
     e que o valor pago corresponda ao valor esperado no banco; idempotente
     (nao duplicar payments se o webhook ja gravou).

3) Preco de parceiro / parte FIF-PL (submit-registration, create-registration-checkout)
   - O preco final vem SO do servidor (offerings / pricing_rules). A escola parceira
     e a situacao FIF-PL declaradas pelo aluno nao podem reduzir o valor cobrado
     sem validacao: gravar como "declarado" e deixar o desconto para validacao staff,
     ou validar a escola contra ski_schools/partners no servidor.

4) URLs de retorno do Stripe (create-registration-checkout)
   - successUrl / cancelUrl: allowlist de origem (https://plateforme.fli.fr,
     https://ski-linguist-hub.lovable.app, preview *.lovable.app, http://localhost:8080).
     Fora da lista -> 400.

5) Conteudo dos e-mails sem escape (fli-email.ts, applyEmailTemplate, send-staff-email,
   send-inscription-documents, process-*-reminders)
   - Escapar HTML de toda variavel vinda do usuario (nomes, textos livres) antes de
     inserir no template. Manter src/lib/email-template-apply.ts e a copia _shared
     identicas + teste de drift + teste "<script> vira &lt;script&gt;".

6) Buscas (GlobalSearch, alunos/formadores/pagamentos) e PDFs de avaliacao
   (sign-private-download, generate-evaluation-pdf)
   - Politica atual FLI: formadores = acesso global. NAO restringir; apenas garantir
     que anon e student nao acessam (student so os proprios). Listar no relatorio.

7) Testes: npm test deve passar. tsgo/tsc sem erros.

8) Entrega: PR com lista, por item, de arquivo alterado e o que mudou; lista das
   Edge Functions a reimplantar no Lovable Cloud depois do merge.
```

## Depois do merge
Me avise o commit: eu confiro os arquivos e reimplanto só as funções listadas pelo Cursor, e marco as alertas como corrigidas.
