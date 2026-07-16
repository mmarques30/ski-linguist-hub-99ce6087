
# Plano — Recuperar acesso de teste

## Diagnóstico (já verificado)

Consultei o backend agora:

- `info@fli.fr` **existe** e **já está confirmado** (`email_confirmed_at = 2026-04-06`).
- Último login bem-sucedido: 12/abr/2026.
- Os erros recentes são `invalid_credentials` (HTTP 400) — ou seja, **senha errada**, não problema de confirmação nem de proxy. As senhas tentadas (`fli2025`, `Fli2025`, `Senha@2670`, `aplica2025`) não batem com a que está no banco.
- `teste@fli.fr` **não existe**.

Portanto o problema real é: senha esquecida. Nada a "confirmar".

## O que farei ao entrar em build mode

1. **Desativar exigência de confirmação de email para novos cadastros** (ambiente de teste)
   - `configure_auth` com `auto_confirm_email: true`, mantendo `disable_signup: true` (registro público continua fechado conforme regra do projeto — só admin cria usuários; a mudança afeta usuários criados via admin/edge function, que já entram confirmados).

2. **Resetar a senha de `info@fli.fr` E criar `teste@fli.fr`** — via edge function descartável
   - Como não há tool direto para "set password", criarei uma edge function temporária `admin-bootstrap` que usa `SUPABASE_SERVICE_ROLE_KEY` para:
     - `auth.admin.updateUserById(<info-id>, { password: "<nova-senha>", email_confirm: true })`
     - `auth.admin.createUser({ email: "teste@fli.fr", password: "<senha>", email_confirm: true })` + inserir role `admin` em `user_roles` + `profiles`
   - Protegida por um `BOOTSTRAP_TOKEN` (secret gerado) para não ficar aberta.
   - Chamo a função uma vez via `curl_edge_functions`, confirmo sucesso, e **apago a função** logo em seguida com `delete_edge_functions` (não fica resíduo no projeto).

3. **Devolver as credenciais no chat**
   - `info@fli.fr` → nova senha
   - `teste@fli.fr` → senha (usuário admin, já confirmado)
   - As senhas serão geradas pelo próprio agente (fortes, ~16 chars) e mostradas uma única vez aqui.

## O que NÃO farei

- Não vou reabrir cadastro público (fere regra do projeto).
- Não vou tocar em `auth.users` direto por SQL (proibido tocar schema `auth`).
- Não vou expor `SERVICE_ROLE_KEY` — ela fica só dentro da edge function temporária.

## Riscos

- A edge function temporária existe por ~1 turno; se algo falhar entre criação e deleção, aviso e removo manualmente. Só aceita chamadas com o token de bootstrap.

Aprove para eu executar.
