

# Background com Foto e Efeito Glassmorphism na Tela de Login

## O que sera feito

Adaptar a pagina `/auth` para usar a foto ESF/FLI como background em tela cheia, com efeito de desfoque (blur), e aplicar glassmorphism no card de login -- inspirado no exemplo do 21st.dev.

## Alteracoes

### 1. Copiar a foto para o projeto
- Copiar `fli_esf_v2_05.png` para `src/assets/fli-auth-bg.png`

### 2. Modificar `src/pages/Auth.tsx`
- Adicionar a foto como background full-screen com `object-cover`
- Aplicar `blur-sm` (desfoque leve) na imagem de fundo
- Adicionar overlay escuro semi-transparente para contraste
- Manter o card centralizado sobre o fundo

### 3. Modificar `src/components/auth/AuthCard.tsx`
- Aplicar efeito glassmorphism no Card:
  - `backdrop-blur-xl` para desfoque no card
  - `bg-white/80` (fundo branco semi-transparente)
  - `border border-white/20` para borda sutil
  - `shadow-2xl` para profundidade
- Garantir legibilidade do texto sobre o fundo translucido

## Resultado visual esperado
- Foto de ski ESF cobrindo toda a tela, levemente desfocada
- Overlay escuro sutil para garantir contraste
- Card de login flutuando com efeito vidro fosco (glassmorphism)
- Visual profissional e moderno

## Detalhes tecnicos
- Imagem importada via ES6 module (`import bgImage from "@/assets/fli-auth-bg.png"`)
- Blur no background: CSS `blur(4px)` ou Tailwind `blur-sm`
- Glassmorphism no card: `backdrop-filter: blur(20px)` + fundo semi-transparente
- Dark mode: ajustar para `bg-black/60` no overlay e `bg-gray-900/70` no card
