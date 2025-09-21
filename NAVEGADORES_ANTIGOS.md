# Suporte para Navegadores Antigos

Este projeto inclui uma versão simplificada especificamente para navegadores antigos, garantindo que usuários com versões mais antigas do Chrome, Firefox, Safari, Internet Explorer ou Edge ainda possam acessar o sistema.

## Navegadores Suportados

### Versão Legacy (Simplificada)

A versão legacy é carregada automaticamente para:

- **Chrome**: versões anteriores à 110
- **Firefox**: versões anteriores à 100
- **Safari**: versões anteriores à 15
- **Internet Explorer**: todas as versões
- **Edge Legacy**: versões anteriores à 90

### Versão Moderna

A versão completa com todas as funcionalidades é carregada para navegadores mais recentes.

## Diferenças entre as Versões

### Versão Moderna (`page.tsx`)

- Animações com Framer Motion
- Cards com efeito flip 3D
- Gradientes CSS modernos
- Flexbox e CSS Grid
- Transformações CSS 3D
- Transições e animações avançadas

### Versão Legacy (`page-legacy.tsx`)

- CSS simples e compatível
- Layout baseado em float como fallback
- Gradientes com prefixos vendor
- Animações CSS básicas
- Sem efeitos 3D ou transformações complexas
- Estilos inline com JSX para máxima compatibilidade

## Detecção Automática

O sistema detecta automaticamente o navegador do usuário através do User Agent e carrega a versão apropriada:

```typescript
const detectLegacyBrowser = () => {
  const userAgent = navigator.userAgent;
  const isOldChrome =
    /Chrome\/([0-9]+)/.test(userAgent) &&
    parseInt(userAgent.match(/Chrome\/([0-9]+)/)![1]) < 110;
  const isOldFirefox =
    /Firefox\/([0-9]+)/.test(userAgent) &&
    parseInt(userAgent.match(/Firefox\/([0-9]+)/)![1]) < 100;
  // ... outras verificações

  return isOldChrome || isOldFirefox || isOldSafari || isIE || isOldEdge;
};
```

## Funcionalidades Mantidas na Versão Legacy

Todas as funcionalidades principais são mantidas:

✅ **Consulta de convênios por CPF ou nome**
✅ **Validação de formulários com Zod**
✅ **Geração de cartões em PDF**
✅ **Interface responsiva**
✅ **Navegação e menus**
✅ **Exibição de resultados**
✅ **Estados de loading e erro**

## Funcionalidades Removidas/Simplificadas

❌ **Animações Framer Motion**
❌ **Cards com flip 3D**
❌ **Efeitos de hover complexos**
❌ **Gradientes CSS modernos**
❌ **Transformações 3D**

## Arquivos Envolvidos

- `src/app/page.tsx` - Página principal com detecção de navegador
- `src/app/page-legacy.tsx` - Versão simplificada para navegadores antigos
- `src/styles/legacy.css` - Estilos específicos para navegadores antigos

## Testando a Versão Legacy

Para testar a versão legacy em um navegador moderno:

1. Abra as ferramentas de desenvolvedor (F12)
2. Vá para a aba "Console"
3. Execute o seguinte comando:

```javascript
// Simular Chrome 109
Object.defineProperty(navigator, "userAgent", {
  value:
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  configurable: true,
});

// Recarregue a página
window.location.reload();
```

## Manutenção

Ao fazer alterações no sistema:

1. **Funcionalidades principais**: Implemente em ambas as versões
2. **Recursos visuais modernos**: Apenas na versão moderna
3. **Testes**: Teste em ambas as versões
4. **CSS**: Use prefixos vendor na versão legacy

## Compatibilidade com Windows 7

A versão legacy foi especificamente otimizada para funcionar no Windows 7 com Chrome 109, incluindo:

- Gradientes com prefixos `-webkit-`
- Flexbox com fallbacks para `float`
- Animações CSS simples
- Sombras com prefixos vendor
- Transições básicas

Esta implementação garante que todos os usuários, independentemente da versão do navegador, tenham acesso às funcionalidades essenciais do sistema.

