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

    // Usar a data de vencimento fornecida pelo usuário ou calcular como um ano após a data atual
    const expirationDate = parsedInput.expirationDate
      ? dayjs(parsedInput.expirationDate).toDate()
      : dayjs().add(1, "year").toDate();

    if (parsedInput.id) {
      // Edição - atualizar incluindo a data de vencimento se fornecida
      await db
        .insert(patientsTable)
        .values({
          ...parsedInput,
          birthDate: parsedInput.birthDate
            ? new Date(parsedInput.birthDate).toISOString()
            : null,
          expirationDate: parsedInput.expirationDate
            ? dayjs(parsedInput.expirationDate).toDate()
            : undefined,
          clinicId: parsedInput.clinicId,
        })
        .onConflictDoUpdate({
          target: [patientsTable.id],
          set: {
            ...parsedInput,
            birthDate: parsedInput.birthDate
              ? new Date(parsedInput.birthDate).toISOString()
              : null,
            expirationDate: parsedInput.expirationDate
              ? dayjs(parsedInput.expirationDate).toDate()
              : undefined,
          },
        });
    } else {
      // Criação - definir a data de expiração
      await db.insert(patientsTable).values({
        ...parsedInput,
        birthDate: parsedInput.birthDate
          ? new Date(parsedInput.birthDate).toISOString()
          : null,
        expirationDate: expirationDate,
        activeAt: new Date(),
      });
    }

    revalidatePath("/patients");
    revalidatePath("/vendedor/patients-seller");
  });
