"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { activatePatientSchema } from "./schema";

export const activatePatient = actionClient
  .schema(activatePatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }

    // Calcular nova data de expiração (data atual + 1 ano)
    const newExpirationDate = dayjs().add(1, "year").toDate();

    // Atualizar a data de expiração do paciente
    await db
      .update(patientsTable)
      .set({
        expirationDate: newExpirationDate,
        // reactivationDate: new Date(), // TODO: Adicionar data de reativação para cadastro vencidos
        updatedAt: new Date(),
      })
      .where(eq(patientsTable.id, parsedInput.patientId));

    revalidatePath("/patients");

    return { success: true };
  });
