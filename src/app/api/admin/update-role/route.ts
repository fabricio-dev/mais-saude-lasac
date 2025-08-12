import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado e é admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem alterar roles." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId e role são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar se o role é válido
    if (!["user", "gestor", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido. Use: user, gestor ou admin" },
        { status: 400 },
      );
    }

    // Verificar se o usuário existe
    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Não permitir alterar role de outros admins
    if (existingUser.role === "admin" && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Não é possível alterar o role de outros administradores" },
        { status: 403 },
      );
    }

    // Não permitir que o admin altere seu próprio role
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio role" },
        { status: 403 },
      );
    }

    // Atualizar o role do usuário no banco de dados
    await db
      .update(usersTable)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    return NextResponse.json({
      success: true,
      message: `Role do usuário alterado para: ${role}`,
    });
  } catch (error) {
    console.error("Erro ao atualizar role:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
