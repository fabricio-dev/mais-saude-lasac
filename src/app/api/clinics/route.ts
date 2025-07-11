import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { clinicsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar clínicas do usuário através da tabela de relacionamento
    const userClinics = await db
      .select({
        id: clinicsTable.id,
        name: clinicsTable.name,
      })
      .from(usersToClinicsTable)
      .innerJoin(
        clinicsTable,
        eq(usersToClinicsTable.clinicId, clinicsTable.id),
      )
      .where(eq(usersToClinicsTable.userId, session.user.id));

    return NextResponse.json(userClinics);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
