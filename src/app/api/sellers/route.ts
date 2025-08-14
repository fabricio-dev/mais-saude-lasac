import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { sellersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicIdFilter = searchParams.get("clinicId");

    // Primeiro, buscar todas as clínicas do usuário
    const userClinics = await db
      .select({ clinicId: usersToClinicsTable.clinicId })
      .from(usersToClinicsTable)
      .where(eq(usersToClinicsTable.userId, session.user.id));

    const userClinicIds = userClinics.map((uc) => uc.clinicId);

    if (userClinicIds.length === 0) {
      return NextResponse.json([]);
    }

    // Se um clinicId específico foi solicitado, verificar se o usuário tem acesso
    let clinicIds = userClinicIds;
    if (clinicIdFilter) {
      if (!userClinicIds.includes(clinicIdFilter)) {
        return NextResponse.json(
          { error: "Unauthorized clinic access" },
          { status: 403 },
        );
      }
      clinicIds = [clinicIdFilter];
    }

    // Buscar vendedores das clínicas permitidas
    const sellers = await db.query.sellersTable.findMany({
      where: inArray(sellersTable.clinicId, clinicIds),
      columns: {
        id: true,
        name: true,
        clinicId: true,
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
