
# Menu Superior com Logo, Notificacoes e Perfil

## Objetivo
Criar um header superior fixo que esconde ao rolar para baixo e reaparece ao voltar ao topo, contendo a logo FLI (removida da sidebar), icones de notificacoes e perfil no estilo dock/glassmorphic. Tambem corrigir o delay visual ao colapsar a sidebar.

## Alteracoes

### 1. Novo componente `src/components/layout/TopHeader.tsx`
- Header fixo no topo com `position: sticky` e comportamento hide-on-scroll
- Usar um hook de scroll direction: ao rolar para baixo o header desliza para cima (`-translate-y-full`), ao rolar para cima ou estar no topo ele reaparece (`translate-y-0`)
- Conteudo:
  - **Esquerda**: `SidebarTrigger` (botao toggle menu lateral) + Logo FLI (imagem `fli-marca-yellow.png`)
  - **Direita**: Icones estilo dock com efeitos hover (scale + glow sutil):
    - `Bell` (notificacoes) - com badge vermelho opcional
    - `User` (perfil) - avatar com iniciais do usuario
- Estilo glassmorphic: `bg-background/80 backdrop-blur-md border-b`
- Transicao suave: `transition-transform duration-300`

### 2. Modificar `src/components/layout/MainLayout.tsx`
- Substituir o header atual pelo novo `TopHeader`
- Remover o header inline existente (linhas 15-17)
- O TopHeader ficara dentro do `SidebarInset` para respeitar o layout da sidebar

### 3. Modificar `src/components/layout/Sidebar.tsx`
- **Remover a logo** do `SidebarHeader` (ja estara no TopHeader)
- Simplificar o `SidebarHeader` para ficar sem conteudo visivel ou remover completamente
- **Corrigir delay de colapso**: adicionar `overflow-hidden` e `transition-none` nos textos dos itens quando colapsado, para que o texto desapareca instantaneamente em vez de fazer fade/slide

### 4. Modificar `src/components/ui/sidebar.tsx`
- No componente `SidebarContent`, alterar a classe de transicao de `duration-200` para remover o delay nos textos ao colapsar (os textos dos menus devem sumir instantaneamente via `opacity-0` com `duration-0` quando collapsed)
- Alternativa: aplicar `[&_span]:group-data-[collapsible=icon]:hidden` para esconder textos imediatamente

## Comportamento do scroll hide/show
```text
Scroll para baixo -> header desliza para cima (hidden)
Scroll para cima  -> header desliza de volta (visible)  
No topo da pagina -> header sempre visivel
```

Implementacao via `useEffect` com `scroll` event listener comparando `scrollY` atual vs anterior.

## Estrutura visual do header
```text
[Toggle] [Logo FLI]                    [Bell] [User]
```

## Ficheiros
- **Novo**: `src/components/layout/TopHeader.tsx`
- **Modificado**: `src/components/layout/MainLayout.tsx`
- **Modificado**: `src/components/layout/Sidebar.tsx`
- **Modificado**: `src/components/ui/sidebar.tsx` (fix delay)
