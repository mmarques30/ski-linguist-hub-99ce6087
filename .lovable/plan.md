
# Corrigir Largura Lateral do Card de Login

## Problema
O card de autenticacao aparece estreito na tela (~300px visual) mesmo com `max-w-xl`. O conteudo interno (inputs, tabs) nao forca o card a expandir lateralmente.

## Solucao
Duas alteracoes no `src/components/auth/AuthCard.tsx`:

1. **Aumentar max-width do Card** de `max-w-xl` (576px) para `max-w-2xl` (672px)
2. **Adicionar `w-full`** no `motion.div` pai para garantir que o card possa expandir dentro do container

### Alteracao
```tsx
// motion.div wrapper - adicionar w-full
<motion.div
  className="w-full max-w-2xl mx-auto"
  initial={{ opacity: 0, y: 20 }}
  ...
>
  <Card className="w-full shadow-xl border-0 bg-card">
```

Isso move o controle de largura para o wrapper e garante que o card ocupe toda a largura disponivel ate 672px, expandindo lateralmente sem alterar a altura.
