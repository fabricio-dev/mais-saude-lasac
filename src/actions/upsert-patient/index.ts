"use server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { clinicsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { sendWhatsAppTemplateAsync } from "@/lib/whatsapp/client";
import { getTemplateConfig } from "@/lib/whatsapp/templates";

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
      const newPatientData = {
        ...parsedInput,
        birthDate: parsedInput.birthDate
          ? convertToUTCDate(parsedInput.birthDate).toISOString()
          : null,
        expirationDate: expirationDate,
        activeAt: parsedInput.contractDate
          ? convertToUTCDate(parsedInput.contractDate)
          : getActivationDate(),
      };

      await db.insert(patientsTable).values(newPatientData);

      // Enviar WhatsApp de boas-vindas para o novo paciente
      // Buscar nome da clínica para incluir na mensagem
      let clinicName: string | undefined;
      if (parsedInput.clinicId) {
        const clinicResult = await db
          .select({ name: clinicsTable.name })
          .from(clinicsTable)
          .where(eq(clinicsTable.id, parsedInput.clinicId))
          .limit(1);
        clinicName = clinicResult[0]?.name;
      }

      // Preparar template do WhatsApp (primeira ativação)
      const templateConfig = getTemplateConfig("activation", {
        patientName: parsedInput.name,
        expirationDate: expirationDate,
        clinicName,
      });

      // Enviar WhatsApp usando template pré-aprovado (não bloqueia o processo)
      sendWhatsAppTemplateAsync({
        phoneNumber: parsedInput.phoneNumber,
        templateName: templateConfig.name,
        parameters: templateConfig.parameters,
      }).catch((error) => {
        // Log do erro mas não propaga (não deve falhar a criação)
        console.error(
          `Erro ao enviar WhatsApp template para novo paciente ${parsedInput.name}:`,
          error,
        );
      });
    }

    revalidatePath("/patients");
    revalidatePath("/vendedor/patients-seller");
    revalidatePath("/gerente/patients-gestor");
  });
