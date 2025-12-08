import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Define um usuário como administrador
 * Esta função deve ser usada apenas em desenvolvimento ou por outro admin
 */
export async function setUserAsAdmin(userEmail: string) {
  try {
    // Listar usuários para encontrar o ID pelo email
    const usersResult = await auth.api.listUsers({
      query: {
        searchValue: userEmail,
        searchField: "email",
        searchOperator: "contains",
      },
    });

    if (!usersResult?.users.length) {
      throw new Error("Usuário não encontrado");
    }

    const user = usersResult.users[0];

    // Definir como admin
    const result = await auth.api.setRole({
      body: {
        userId: user.id,
        role: "admin",
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: `Usuário ${userEmail} agora é administrador`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Remove privilégios de admin de um usuário
 */
export async function removeUserAdmin(userEmail: string) {
  try {
    // Listar usuários para encontrar o ID pelo email
    const usersResult = await auth.api.listUsers({
      query: {
        searchValue: userEmail,
        searchField: "email",
        searchOperator: "contains",
      },
    });

    if (!usersResult?.users.length) {
      throw new Error("Usuário não encontrado");
    }

    const user = usersResult.users[0];

    // Definir como usuário comum
    const result = await auth.api.setRole({
      body: {
        userId: user.id,
        role: "user",
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: `Usuário ${userEmail} agora é usuário comum`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
