"use server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

// Configurar plugins do dayjs para lidar corretamente com fusos horários
dayjs.extend(utc);
dayjs.extend(timezone);

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }

    // Função auxiliar para converter datas do formulário (horário local SP) para UTC
    // Interpreta a data como horário de São Paulo e converte para UTC
    const convertToUTCDate = (dateString: string) => {
      return dayjs
        .tz(dateString, "America/Sao_Paulo")
        .startOf("day") // Início do dia em São Paulo (00:00:00)
        .utc() // Converte para UTC
        .toDate();
    };

    // Função auxiliar para data de ativação (momento atual em UTC)
    // Registra o momento exato da ativação em UTC
    const getActivationDate = () => {
      return dayjs().utc().toDate();
    };

    // Usar a data de vencimento fornecida pelo usuário ou calcular como um ano após a data atual
    const expirationDate = parsedInput.expirationDate
      ? convertToUTCDate(parsedInput.expirationDate)
      : dayjs().utc().add(1, "year").toDate();

    if (parsedInput.id) {
      // Edição - atualizar incluindo a data de vencimento se fornecida
      await db
        .insert(patientsTable)
        .values({
          ...parsedInput,
          birthDate: parsedInput.birthDate
            ? convertToUTCDate(parsedInput.birthDate).toISOString()
            : null,
          expirationDate: parsedInput.expirationDate
            ? convertToUTCDate(parsedInput.expirationDate)
            : undefined,
          clinicId: parsedInput.clinicId,
        })
        .onConflictDoUpdate({
          target: [patientsTable.id],
          set: {
            ...parsedInput,
            birthDate: parsedInput.birthDate
              ? convertToUTCDate(parsedInput.birthDate).toISOString()
              : null,
            expirationDate: parsedInput.expirationDate
              ? convertToUTCDate(parsedInput.expirationDate)
              : undefined,
          },
        });
    } else {
      // Criação - definir a data de expiração
      await db.insert(patientsTable).values({
        ...parsedInput,
        birthDate: parsedInput.birthDate
          ? convertToUTCDate(parsedInput.birthDate).toISOString()
          : null,
        expirationDate: expirationDate,
        activeAt: getActivationDate(),
      });
    }

    revalidatePath("/patients");
    revalidatePath("/vendedor/patients-seller");
    revalidatePath("/gerente/patients-gestor");
  });
