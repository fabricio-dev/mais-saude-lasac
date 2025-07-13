"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { clinicsTable, sellersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertClinicSchema } from "./schema";

export const upsertClinic = actionClient
  .schema(upsertClinicSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.id) {
      throw new Error("Usuário não encontrado");
    }

    if (parsedInput.id) {
      // Buscar o nome atual da clínica antes de atualizar
      const currentClinic = await db
        .select({ name: clinicsTable.name })
        .from(clinicsTable)
        .where(eq(clinicsTable.id, parsedInput.id))
        .limit(1);

      const oldClinicName = currentClinic[0]?.name;

      // Atualizar clínica existente
      await db
        .update(clinicsTable)
        .set({
          name: parsedInput.name,
          updatedAt: new Date(),
        })
        .where(eq(clinicsTable.id, parsedInput.id));

      // Se o nome da clínica mudou, atualizar todos os vendedores que têm o nome antigo na coluna unity
      if (oldClinicName && oldClinicName !== parsedInput.name) {
        await db
          .update(sellersTable)
          .set({
            unity: parsedInput.name,
          })
          .where(eq(sellersTable.unity, oldClinicName));
      }
    } else {
      // Criar nova clínica
      const [clinic] = await db
        .insert(clinicsTable)
        .values({
          name: parsedInput.name,
        })
        .returning();

      // Associar a clínica ao usuário
      await db.insert(usersToClinicsTable).values({
        userId: session.user.id,
        clinicId: clinic.id,
      });
    }

    revalidatePath("/clinics");
    revalidatePath("/sellers");
    revalidatePath("/patients");
  });
