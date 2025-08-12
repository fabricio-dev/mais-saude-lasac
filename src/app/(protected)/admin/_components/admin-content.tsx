"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/use-permissions";
import { authClient } from "@/lib/auth-client";

export const AdminContent = () => {
  const { isAdmin, user } = usePermissions();
  const [userEmail, setUserEmail] = useState("");
  const [newRole, setNewRole] = useState<"gestor" | "user">("user");
  const [isLoading, setIsLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Acesso negado. Apenas administradores podem acessar esta página.
        </p>
      </div>
    );
  }

  const handleCheckPermission = async () => {
    try {
      setIsLoading(true);
      const result = await authClient.admin.hasPermission({
        permissions: {
          user: ["create", "delete"],
        },
      });

      toast.success(`Permissões verificadas: ${JSON.stringify(result.data)}`);
    } catch {
      toast.error("Erro ao verificar permissões");
    } finally {
      setIsLoading(false);
    }
  };

  const handleListUsers = async () => {
    try {
      setIsLoading(true);
      const result = await authClient.admin.listUsers({
        query: {
          limit: 10,
        },
      });

      if (result.data) {
        toast.success(`Encontrados ${result.data.users.length} usuários`);
        console.log("Usuários:", result.data.users);
      }
    } catch {
      toast.error("Erro ao listar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeUserRole = async () => {
    if (!userEmail) {
      toast.error("Por favor, informe o email do usuário");
      return;
    }

    // Verificar se não está tentando alterar o próprio role
    if (userEmail === user?.email) {
      toast.error("Você não pode alterar seu próprio role");
      return;
    }

    try {
      setIsLoading(true);

      // Primeiro, listar usuários para encontrar o ID pelo email
      const usersResult = await authClient.admin.listUsers({
        query: {
          searchValue: userEmail,
          searchField: "email",
          searchOperator: "contains",
        },
      });

      if (!usersResult.data?.users.length) {
        toast.error("Usuário não encontrado");
        return;
      }

      const targetUser = usersResult.data.users[0];

      // Verificar se o usuário não é um admin (não permitir alterar role de outros admins)
      if (targetUser.role === "admin") {
        toast.error("Não é possível alterar o role de outros administradores");
        return;
      }

      // Para "gestor", primeiro definir como "user" e depois atualizar manualmente
      if (newRole === "gestor") {
        // Definir como user primeiro
        await authClient.admin.setRole({
          userId: targetUser.id,
          role: "user",
        });

        // Fazer uma requisição para atualizar o role para "gestor" no banco
        const updateResponse = await fetch("/api/admin/update-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: targetUser.id,
            role: "gestor",
          }),
        });

        if (updateResponse.ok) {
          toast.success("Role do usuário alterado para: Gestor");
          setUserEmail("");
        } else {
          toast.error("Erro ao definir role como gestor");
        }
      } else {
        // Para role "user", usar o método normal
        const result = await authClient.admin.setRole({
          userId: targetUser.id,
          role: "user",
        });

        if (result.data) {
          toast.success("Role do usuário alterado para: Usuário");
          setUserEmail("");
        }
      }
    } catch {
      toast.error("Erro ao alterar role do usuário");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Admin</CardTitle>
          <CardDescription>
            Suas informações como administrador do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Nome:</Label>
            <p className="text-muted-foreground text-sm">{user?.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Email:</Label>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Role:</Label>
            <p className="text-sm font-semibold text-emerald-600">
              Administrador
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verificar Permissões</CardTitle>
          <CardDescription>
            Teste a verificação de permissões do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCheckPermission}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Verificando..." : "Verificar Minhas Permissões"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listar Usuários</CardTitle>
          <CardDescription>
            Ver todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleListUsers}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Carregando..." : "Listar Usuários"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Role de Usuário</CardTitle>
          <CardDescription>
            Alterar o papel de um usuário entre Gestor ou Usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userEmail">Email do Usuário</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="usuario@exemplo.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newRole">Novo Role</Label>
            <Select
              value={newRole}
              onValueChange={(value: "gestor" | "user") => setNewRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleChangeUserRole}
            disabled={isLoading || !userEmail}
            className="w-full"
          >
            {isLoading ? "Alterando..." : "Alterar Role"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
