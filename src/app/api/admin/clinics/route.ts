import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export async function GET() {
  try {
    // Buscar todos os usuários admin (pode existir mais de 1)
    const adminUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));

    if (adminUsers.length === 0) {
      return NextResponse.json(
        { error: "Usuário admin não encontrado" },
        { status: 404 },
      );
    }

    const adminIds = adminUsers.map((user) => user.id);

    // Buscar todas as clínicas vinculadas a qualquer admin através da tabela de relacionamento
    const userClinics = await db.query.usersToClinicsTable.findMany({
      where: (userToClinic) => inArray(userToClinic.userId, adminIds),
      with: {
        clinic: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Extrair as clínicas e remover duplicadas (caso mais de um admin esteja vinculado à mesma clínica)
    const clinicsMap = new Map<string, { id: string; name: string }>();
    for (const userClinic of userClinics) {
      if (userClinic.clinic) {
        clinicsMap.set(userClinic.clinic.id, userClinic.clinic);
      }
    }
    const clinics = Array.from(clinicsMap.values());

    // Ordenar por nome
    clinics.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(clinics);
  } catch (error) {
    console.error("Erro ao buscar clínicas do admin:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
