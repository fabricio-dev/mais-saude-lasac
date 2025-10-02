"use server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
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
      // Edição - verificar se paciente já foi reativado
      const existingPatient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, parsedInput.id),
      });

      // Determinar para qual campo vai a data do contrato
      const contractDateData: {
        activeAt?: Date;
        reactivatedAt?: Date;
      } = {};

      if (parsedInput.contractDate) {
        if (existingPatient?.reactivatedAt) {
          // Paciente já foi reativado → atualizar reactivatedAt
          contractDateData.reactivatedAt = convertToUTCDate(
            parsedInput.contractDate,
          );
        } else {
          // Paciente nunca foi reativado → atualizar activeAt
          contractDateData.activeAt = convertToUTCDate(
            parsedInput.contractDate,
          );
        }
      }

      // Remover contractDate do parsedInput pois é processado separadamente
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contractDate, ...patientData } = parsedInput;

      await db
        .insert(patientsTable)
        .values({
          ...patientData,
          birthDate: patientData.birthDate
            ? convertToUTCDate(patientData.birthDate).toISOString()
            : null,
          expirationDate: patientData.expirationDate
            ? convertToUTCDate(patientData.expirationDate)
            : undefined,
          ...contractDateData,
          clinicId: patientData.clinicId,
        })
        .onConflictDoUpdate({
          target: [patientsTable.id],
          set: {
            ...patientData,
            birthDate: patientData.birthDate
              ? convertToUTCDate(patientData.birthDate).toISOString()
              : null,
            expirationDate: patientData.expirationDate
              ? convertToUTCDate(patientData.expirationDate)
              : undefined,
            ...contractDateData,
          },
        });
    } else {
      // Criação - sempre usar activeAt
      await db.insert(patientsTable).values({
        ...parsedInput,
        birthDate: parsedInput.birthDate
          ? convertToUTCDate(parsedInput.birthDate).toISOString()
          : null,
        expirationDate: expirationDate,
        activeAt: parsedInput.contractDate
          ? convertToUTCDate(parsedInput.contractDate)
          : getActivationDate(),
      });
    }

    revalidatePath("/patients");
    revalidatePath("/vendedor/patients-seller");
    revalidatePath("/gerente/patients-gestor");
  });
