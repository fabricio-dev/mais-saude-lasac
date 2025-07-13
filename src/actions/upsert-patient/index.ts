"use server";
import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }

    // Calcular a data de expiração como um ano após a data atual (apenas para novos pacientes)
    const expirationDate = dayjs().add(1, "year").toDate();

    // Se é uma edição (tem ID), não sobrescrever a data de expiração
    if (parsedInput.id) {
      await db
        .insert(patientsTable)
        .values({
          ...parsedInput,
          birthDate: new Date(parsedInput.birthDate).toISOString(),
          clinicId: parsedInput.clinicId,
        })
        .onConflictDoUpdate({
          target: [patientsTable.id],
          set: {
            ...parsedInput,
            birthDate: new Date(parsedInput.birthDate).toISOString(),
          },
        });
    } else {
      // Se é uma criação (sem ID), definir a data de expiração
      await db.insert(patientsTable).values({
        ...parsedInput,
        birthDate: new Date(parsedInput.birthDate).toISOString(),
        expirationDate: expirationDate,
      });
    }

    revalidatePath("/patients");
  });
