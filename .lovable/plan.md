

# Gestao de Usuarios com Permissoes por Aba/Sub-aba

## Objetivo
Criar um sistema completo de gestao de usuarios dentro do menu Administration, permitindo ao admin criar novos usuarios e configurar permissoes granulares de visualizacao e edicao por aba e sub-aba do sistema.

## Arquitetura do Banco de Dados

### 1. Tabela `user_roles` (papel global)
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
```

### 2. Tabela `user_permissions` (permissoes granulares por rota)
```sql
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  route_key TEXT NOT NULL,        -- ex: "finance", "finance.analyses", "inscriptions"
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, route_key)
);
```

### 3. Tabela `profiles` (informacoes do usuario)
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Funcao de seguranca + RLS
- Funcao `has_role(user_id, role)` como SECURITY DEFINER para evitar recursao
- RLS em `user_roles`: somente admins podem ler/escrever
- RLS em `user_permissions`: somente admins podem ler/escrever
- RLS em `profiles`: admins podem ver todos, usuario pode ver o proprio
- Trigger para criar profile automaticamente ao criar usuario (via auth trigger)

## Rotas do Sistema (route_keys)
Mapa completo de rotas para permissoes:

| route_key | Label | Pai |
|-----------|-------|-----|
| dashboard | Dashboard | - |
| finance | Vue d'ensemble | Gestion |
| finance.analyses | Analyses | Finance |
| finance.rentabilite | Rentabilite | Finance |
| finance.tresorerie | Tresorerie | Finance |
| finance.charges_fixes | Charges fixes | Finance |
| inscriptions | Inscriptions | Gestion |
| invoices | Factures | Gestion |
| students | Stagiaires | Gestion |
| tests | Tests de niveau | Formation |
| evaluations | Evaluations | Formation |
| classes | Sessions | Formation |
| satisfaction | Satisfaction | Qualite |
| amelioration | Amelioration | Qualite |
| documents | Documents | Qualite |
| admin | Administration | - |

Admins tem acesso total automaticamente. A secao "Administration" so aparece para admins.

## Ficheiros Novos

### `src/pages/admin/UserManagement.tsx`
Pagina principal de gestao de usuarios com:
- Lista de usuarios (tabela com nome, email, role, status)
- Botao "Ajouter un utilisateur"
- Acoes: editar permissoes, desativar

### `src/components/admin/UserFormDialog.tsx`
Dialog para criar novo usuario:
- Campos: nome completo, email, senha temporaria
- Select de role (admin / user)
- Grid de permissoes com checkboxes por aba/sub-aba (can_view, can_edit)
- Estrutura em accordion por grupo (Gestion, Formation, Qualite)

### `src/components/admin/UserPermissionsEditor.tsx`
Componente reutilizavel com a grid de permissoes:
- Accordion por grupo de navegacao
- Cada item com 2 checkboxes: Visualiser / Modifier
- Toggle "tout selectionner" por grupo
- Logica: se can_edit=true, can_view e forcado a true

### `src/hooks/useUserManagement.ts`
Hook para CRUD de usuarios:
- Listar profiles + roles + permissions
- Criar usuario (via edge function que chama admin API)
- Atualizar permissoes
- Desativar usuario

### `src/hooks/useUserPermissions.ts`
Hook para verificar permissoes do usuario logado:
- Carrega permissoes do usuario atual
- Funcao `canView(routeKey)` e `canEdit(routeKey)`
- Admins retornam true para tudo

### Edge Function `supabase/functions/create-user/index.ts`
- Recebe email, password, full_name, role, permissions
- Usa service_role para criar usuario via `supabase.auth.admin.createUser()`
- Insere profile, role e permissions
- Retorna o usuario criado

## Ficheiros Modificados

### `src/components/layout/Sidebar.tsx`
- Adicionar item "Utilisateurs" no grupo Administration (icone `UserCog`)
- Filtrar itens de navegacao baseado nas permissoes do usuario (esconder abas sem can_view)

### `src/App.tsx`
- Adicionar rota `/admin/users` -> `UserManagement`

### `src/components/auth/ProtectedRoute.tsx`
- Versao melhorada que aceita prop `routeKey` opcional
- Se routeKey fornecido, verifica se usuario tem can_view para essa rota
- Se nao tem, redireciona para "/" ou mostra pagina "Acces refuse"

## Fluxo de Criacao de Usuario

1. Admin clica "Ajouter un utilisateur"
2. Preenche nome, email, senha temporaria
3. Seleciona role (admin/user)
4. Se role=user, configura permissoes aba por aba com checkboxes
5. Ao salvar, chama edge function `create-user`
6. Edge function cria usuario, profile, role e permissions
7. Lista atualiza mostrando novo usuario

## Detalhes Tecnicos

- O `create-user` edge function usa `SUPABASE_SERVICE_ROLE_KEY` (ja configurado)
- Permissoes sao armazenadas como linhas individuais em `user_permissions` (uma por rota)
- A sidebar filtra dinamicamente: se usuario nao tem can_view para nenhum item de um grupo, o grupo inteiro some
- O hook `useUserPermissions` usa cache via react-query para evitar queries repetidas
- Nenhuma verificacao de permissao via localStorage (tudo server-side via RLS + queries)

