import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { sellersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Primeiro, buscar todas as clínicas do usuário
    const userClinics = await db
      .select({ clinicId: usersToClinicsTable.clinicId })
      .from(usersToClinicsTable)
      .where(eq(usersToClinicsTable.userId, session.user.id));

    const clinicIds = userClinics.map((uc) => uc.clinicId);

    if (clinicIds.length === 0) {
      return NextResponse.json([]);
    }

    // Buscar vendedores de todas as clínicas do usuário
    const sellers = await db.query.sellersTable.findMany({
      where: inArray(sellersTable.clinicId, clinicIds),
      columns: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
