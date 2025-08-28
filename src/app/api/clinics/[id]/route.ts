import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const clinicId = params.id as string;

    const clinic = await db
      .select({ name: clinicsTable.name })
      .from(clinicsTable)
      .where(eq(clinicsTable.id, clinicId))
      .limit(1);

    if (!clinic[0]) {
      return NextResponse.json(
        { error: "Clínica não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ name: clinic[0].name });
  } catch (error) {
    console.error("Erro ao buscar clínica:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
