# Correções de segurança — plano em português (nada executado ainda)

## Situação
- Você pediu para corrigir 79 alertas de segurança.
- Muitas são repetições de alertas já corrigidas no site (PR #182, #183, #189 e a falha do "crachá falso" corrigida ontem).
- Quase todas tocam no cadastro, no pagamento e nos e-mails. São os arquivos que devem ficar iguais ao GitHub (main): uma correção feita só aqui é apagada no próximo envio do GitHub.

## Etapa 1 — Marcar as já corrigidas (sem mudar nada)
Marcar como corrigidas as alertas que já estão resolvidas no site: crachá falso, ficha de aluno sobrescrita pelo e-mail, taxa de presença, preço enviado pelo navegador, configuração do Stripe, funções de lembrete e prospecção protegidas.

## Etapa 2 — Dúvidas para você decidir (antes de qualquer correção)

1. **Retorno do pagamento confirma a inscrição**
   Hoje: a página depois do pagamento confirma a inscrição, mas só se o Stripe disser que está paga.
   Minha sugestão: deixar como está (alarme falso). Alternativa: confirmar só pelo aviso automático do Stripe (alguns segundos de atraso).

2. **Login de administrador de teste**
   Pode ser um risco real: uma conta de teste com poderes de admin poderia ser usada.
   Minha sugestão: verificar primeiro e, se existir, desativar ou trocar a senha.

3. **Preço de parceiro e parte FIF-PL**
   Hoje: o aluno escolhe a escola parceira e declara sua situação, e isso muda o preço.
   Pergunta: o preço deve ser recalculado pela equipe depois, ou o valor declarado vale?

4. **Endereços de retorno do Stripe livres**
   Hoje: o site diz para onde o Stripe volta depois do pagamento; alguém poderia trocar por outro site.
   Minha sugestão: aceitar só endereços do site FLI (plateforme.fli.fr e o site publicado).

5. **Conteúdo dos e-mails sem proteção**
   Hoje: nomes e textos digitados entram nos e-mails sem limpeza; dá para inserir código.
   Minha sugestão: limpar esses textos antes de enviar.

6. **Buscas e PDFs de avaliação**
   Hoje: formadores veem todos os PDFs de avaliação e podem buscar alunos e pagamentos.
   Segue a regra "formadores têm acesso total". Pergunta: manter assim ou limitar aos alunos de cada formador?

## Etapa 3 — Onde corrigir
- As correções reais (itens 2, 4, 5 e o que você decidir em 1, 3, 6) são feitas no GitHub (Cursor) e depois reimplantadas aqui, para não serem apagadas.
- Ou, se você preferir, faço aqui no Lovable e você leva para o GitHub logo depois.

## O que preciso de você
Responder as 6 dúvidas e dizer onde corrigir (GitHub ou Lovable). Nenhum e-mail será enviado, nenhum cron ligado, nenhum segredo alterado.
