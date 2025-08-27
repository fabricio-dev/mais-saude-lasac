import { NextResponse } from "next/server";

import { db } from "@/db";

export async function GET() {
  try {
    // Buscar o usuário admin (deve existir apenas 1)
    const adminUser = await db.query.usersTable.findFirst({
      where: (user, { eq }) => eq(user.role, "admin"),
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Usuário admin não encontrado" },
        { status: 404 },
      );
    }

    // Buscar todas as clínicas do usuário admin através da tabela de relacionamento
    const userClinics = await db.query.usersToClinicsTable.findMany({
      where: (userToClinic, { eq }) => eq(userToClinic.userId, adminUser.id),
      with: {
        clinic: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Extrair apenas as clínicas dos resultados
    const clinics = userClinics.map((userClinic) => userClinic.clinic);

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
