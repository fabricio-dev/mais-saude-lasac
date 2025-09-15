import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { sellersTable } from "@/db/schema";

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

    // Buscar vendedores da clínica especificada
    const sellers = await db
      .select({
        id: sellersTable.id,
        name: sellersTable.name,
        clinicId: sellersTable.clinicId,
      })
      .from(sellersTable)
      .where(eq(sellersTable.clinicId, clinicId))
      .orderBy(sellersTable.name);

    return NextResponse.json(sellers);
  } catch (error) {
    console.error("Erro ao buscar vendedores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
