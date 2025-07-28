# Sistema de Administração - Better Auth

Este documento explica como usar o sistema de verificação de admin/usuário comum implementado no projeto.

## 🚀 Funcionalidades Implementadas

### ✅ Plugin Admin do Better Auth

- Sistema completo de roles (admin/user)
- Gerenciamento de usuários
- Verificação de permissões
- Proteção de rotas baseada em roles

### ✅ Componentes e Hooks

- `usePermissions()` - Hook para verificar permissões
- Sidebar com filtros baseados em role
- Middleware de proteção de rotas
- Página administrativa completa

## 📋 Como Usar

### 1. Verificar Permissões em Componentes

```typescript
import { usePermissions } from "@/hooks/use-permissions";

export const MyComponent = () => {
  const { isAdmin, isUser, permissions } = usePermissions();

  if (isAdmin) {
    return <AdminPanel />;
  }

  return <UserPanel />;
};
```

### 2. Proteger Rotas

O middleware já está configurado para proteger automaticamente:

- **Rotas protegidas**: `/dashboard`, `/patients`, `/sellers`, `/clinics`
- **Rotas admin**: `/admin`, `/management`

### 3. Usar Funcionalidades Admin

```typescript
import { authClient } from "@/lib/auth-client";

// Listar usuários (apenas admin)
const users = await authClient.admin.listUsers({
  limit: 10,
});

// Alterar role de usuário
await authClient.admin.setRole({
  userId: "user-id",
  role: "admin", // ou "user"
});

// Verificar permissões
const hasPermission = await authClient.admin.hasPermission({
  permissions: {
    user: ["create", "delete"],
  },
});
```

## 🔧 Tornar um Usuário Admin

### Opção 1: Através da Interface Admin

1. Acesse `/admin` (apenas como admin)
2. Use o formulário "Alterar Role de Usuário"
3. Digite o email do usuário
4. Selecione "Administrador"

### Opção 2: Diretamente no Banco

```sql
UPDATE users SET role = 'admin' WHERE email = 'usuario@exemplo.com';
```

### Opção 3: Via Action Server

```typescript
import { setUserAsAdmin } from "@/actions/set-user-admin";

const result = await setUserAsAdmin("usuario@exemplo.com");
```

## 🎯 Exemplo de Uso Prático

```typescript
// Em um componente
import { usePermissions } from "@/hooks/use-permissions";

export const PatientsList = () => {
  const { isAdmin, permissions } = usePermissions();

  return (
    <div>
      <h1>Lista de Pacientes</h1>

      {/* Todos os usuários podem ver a lista */}
      <PatientTable />

      {/* Apenas admins podem deletar */}
      {isAdmin && (
        <Button variant="destructive">
          Deletar Paciente
        </Button>
      )}

      {/* Verificação granular de permissões */}
      {permissions.canManageUsers && (
        <AdminActions />
      )}
    </div>
  );
};
```

## 🔐 Estrutura de Roles

### Admin (`role: "admin"`)

- Acesso total ao sistema
- Pode gerenciar outros usuários
- Acesso à página `/admin`
- Pode alterar roles
- Pode ban/unban usuários

### User (`role: "user"`)

- Acesso às funcionalidades básicas
- Limitado à sua clínica
- Não pode gerenciar outros usuários
- Sem acesso à página `/admin`

## 📊 Campos Adicionados ao Banco

### Tabela `users`

- `role` - text (default: "user")
- `banned` - boolean (default: false)
- `banReason` - text
- `banExpires` - timestamp

### Tabela `sessions`

- `impersonatedBy` - text (para impersonação)

## 🛡️ Segurança

- Middleware protege rotas automaticamente
- Verificação server-side em todas as páginas
- Tokens de sessão seguros
- Permissões granulares

## 🚨 Importante

1. **Primeiro Admin**: O primeiro usuário admin deve ser criado manualmente no banco ou via action
2. **Backup**: Sempre tenha pelo menos um admin no sistema
3. **Produção**: Use variáveis de ambiente para definir admins iniciais

## 📚 Recursos Disponíveis

- ✅ Verificação de roles
- ✅ Proteção de rotas
- ✅ Interface admin
- ✅ Gerenciamento de usuários
- ✅ Sistema de permissões
- ✅ Ban/unban usuários
- ✅ Impersonação (disponível via API)

## 🎉 Próximos Passos

Para expandir o sistema, você pode:

1. Adicionar mais roles específicos (moderator, editor, etc.)
2. Implementar permissões granulares por recurso
3. Criar audit logs para ações administrativas
4. Implementar sistema de aprovação para mudanças de role
