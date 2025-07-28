"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import z from "zod";

import { db } from "@/db";
import { sellersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const deleteSeller = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // Buscar as clínicas do usuário
    const userClinics = await db
      .select({ clinicId: usersToClinicsTable.clinicId })
      .from(usersToClinicsTable)
      .where(eq(usersToClinicsTable.userId, session.user.id));

    const clinicIds = userClinics.map((uc) => uc.clinicId);

    if (clinicIds.length === 0) {
      throw new Error("Você não tem permissão para deletar este vendedor");
    }

    const seller = await db.query.sellersTable.findFirst({
      where: eq(sellersTable.id, parsedInput.id),
    });

    if (!seller) {
      throw new Error("Vendedor não encontrado");
    }

    // Verificar se o vendedor pertence a alguma das clínicas do usuário
    if (!seller.clinicId || !clinicIds.includes(seller.clinicId)) {
      throw new Error("Você não tem permissão para deletar esse vendedor");
    }

    await db.delete(sellersTable).where(eq(sellersTable.id, parsedInput.id));
    revalidatePath("/sellers");
  });
//deletar vendedor e usuario vinculados a ele
