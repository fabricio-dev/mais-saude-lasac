import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { cpf, patientId } = await request.json();

    if (!cpf) {
      return NextResponse.json({ exists: false });
    }

    const cleanCPF = cpf.replace(/\D/g, "");

    if (cleanCPF.length !== 11) {
      return NextResponse.json({ exists: false });
    }

    let whereCondition = eq(patientsTable.cpfNumber, cleanCPF);

    // Se é uma edição, excluir o próprio registro da busca
    if (patientId) {
      whereCondition = and(
        eq(patientsTable.cpfNumber, cleanCPF),
        ne(patientsTable.id, patientId),
      ) as typeof whereCondition;
    }

    const existingPatient = await db
      .select()
      .from(patientsTable)
      .where(whereCondition)
      .limit(1);

    return NextResponse.json({ exists: existingPatient.length > 0 });
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json({ exists: false });
  }
}
