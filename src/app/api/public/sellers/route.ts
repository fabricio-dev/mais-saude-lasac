import { NextResponse } from "next/server";

import { db } from "@/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");

    if (!clinicId) {
      return NextResponse.json(
        { error: "clinicId é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar vendedores da clínica especificada com nome "Cadastro-externo" (case-insensitive)
    const sellers = await db.query.sellersTable.findMany({
      where: (seller, { eq, and, ilike }) =>
        and(
          eq(seller.clinicId, clinicId),
          ilike(seller.name, "%cadastro-externo%"),
        ),
      columns: {
        id: true,
        name: true,
        clinicId: true,
      },
      orderBy: (seller, { asc }) => asc(seller.name),
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error("Erro ao buscar vendedores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
