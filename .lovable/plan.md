
# Sidebar oculto completamente + Cores Navy no menu lateral e superior

## Objetivo
1. Quando o menu lateral for ocultado, ele deve desaparecer completamente (sem deixar icones visiveis)
2. Aplicar a cor azul escuro da marca (#14213D) no fundo do menu lateral e do menu superior

## Alteracoes

### 1. `src/components/layout/Sidebar.tsx`
- Alterar `collapsible="icon"` para `collapsible="offcanvas"` no componente `<Sidebar>`, fazendo com que o menu desapareca totalmente ao ser ocultado em vez de colapsar para um modo de icones

### 2. `src/index.css` - Cores do sidebar e header
- Atualizar as variaveis CSS do sidebar para usar o azul navy (#14213D = HSL 219 52% 16%):
  - `--sidebar-background`: de `300 2% 18%` para `219 52% 16%` (navy)
  - `--sidebar-foreground`: manter `0 0% 95%` (texto claro)
  - `--sidebar-accent`: de `300 2% 25%` para `219 52% 22%` (navy mais claro para hover)
  - `--sidebar-accent-foreground`: manter `0 0% 95%`
  - `--sidebar-border`: de `300 2% 30%` para `219 52% 25%` (borda navy)
- O dark mode tambem sera ajustado para manter consistencia

### 3. `src/components/layout/TopHeader.tsx` - Cor navy no header
- Alterar o fundo do header de `bg-background/80` para usar a cor navy (#14213D) com backdrop-blur
- Ajustar as cores dos icones e textos para ficarem claros (brancos) sobre o fundo escuro
- Ajustar os botoes de notificacao e perfil para usar tons claros compativeis com o fundo navy
- O botao SidebarTrigger tambem sera estilizado com texto claro

### Resultado visual
O menu lateral e o header superior terao fundo azul escuro (#14213D) com textos e icones brancos/claros, e o menu lateral sumira completamente ao ser ocultado (sem modo de icones residual).
