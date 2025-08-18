import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clinicsTable, sellersTable } from "@/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do vendedor é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar vendedor com informações da clínica
    const seller = await db
      .select({
        id: sellersTable.id,
        name: sellersTable.name,
        clinicId: sellersTable.clinicId,
        clinicName: clinicsTable.name,
        phoneNumber: sellersTable.phoneNumber,
        pixKey: sellersTable.pixKey,
        pixKeyType: sellersTable.pixKeyType,
      })
      .from(sellersTable)
      .leftJoin(clinicsTable, eq(sellersTable.clinicId, clinicsTable.id))
      .where(eq(sellersTable.id, id))
      .limit(1);

    if (seller.length === 0) {
      return NextResponse.json(
        { error: "Vendedor não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(seller[0]);
  } catch (error) {
    console.error("Erro ao buscar vendedor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
