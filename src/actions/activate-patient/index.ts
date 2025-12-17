"use server";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  clinicsTable,
  patientsTable,
  sellersTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { sendWhatsAppTemplateAsync } from "@/lib/whatsapp/client";
import { getTemplateConfig } from "@/lib/whatsapp/templates";

import { activatePatientSchema } from "./schema";

// Configurar plugins do dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

export const activatePatient = actionClient
  .schema(activatePatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }

    // Buscar o paciente primeiro
    const patientResult = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.id, parsedInput.patientId));

    const patient = patientResult[0];

    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    // Verificar permissões baseado no role do usuário
    if (session.user.role === "admin") {
      // Para admins: verificar se o paciente pertence a alguma clínica do admin
      const userClinics = await db
        .select({ clinicId: usersToClinicsTable.clinicId })
        .from(usersToClinicsTable)
        .where(eq(usersToClinicsTable.userId, session.user.id));

      const clinicIds = userClinics.map((uc) => uc.clinicId);

      if (clinicIds.length === 0) {
        throw new Error("Você não está associado a nenhuma clínica");
      }

      if (!patient.clinicId || !clinicIds.includes(patient.clinicId)) {
        throw new Error("Você não tem permissão para ativar este paciente");
      }
    } else if (session.user.role === "gestor") {
      // Para gestores: verificar se o paciente pertence à clínica do gestor
      const gestor = await db
        .select()
        .from(sellersTable)
        .where(eq(sellersTable.email, session.user.email))
        .limit(1);

      if (!gestor[0]) {
        throw new Error("Gestor não encontrado");
      }

      if (!patient.clinicId || patient.clinicId !== gestor[0].clinicId) {
        throw new Error(
          "Você não tem permissão para ativar este paciente - ele pertence a outra unidade",
        );
      }
    } else {
      // Para vendedores (role "user"): verificar se o paciente pertence ao vendedor
      const seller = await db
        .select()
        .from(sellersTable)
        .where(eq(sellersTable.email, session.user.email))
        .limit(1);

      if (!seller[0]) {
        throw new Error("Vendedor não encontrado");
      }

      if (
        !patient.clinicId ||
        patient.clinicId !== seller[0].clinicId ||
        patient.sellerId !== seller[0].id
      ) {
        throw new Error(
          "Você precisa editar o vendedor do convênio para depois ativá-lo",
        );
      }
    }

    // Obter data/hora atual no fuso horário de São Paulo e converter para UTC
    const now = dayjs.tz(new Date(), "America/Sao_Paulo").utc().toDate();

    // Calcular nova data de expiração (data atual + 1 ano)
    const newExpirationDate = dayjs(now).add(1, "year").toDate();

    // Calcular dias restantes considerando fuso horário brasileiro
    // Converter ambas as datas para São Paulo e comparar apenas as datas (sem horas)
    const expirationDateSP = dayjs(patient.expirationDate)
      .tz("America/Sao_Paulo")
      .startOf("day");
    const nowSP = dayjs.tz(new Date(), "America/Sao_Paulo").startOf("day");
    const timeRemaining = expirationDateSP.diff(nowSP, "days");

    const newExpirationDateAntecipated = dayjs(now)
      .add(1, "year")
      .add(timeRemaining, "days")
      .toDate();

    // Determinar se é primeira ativação ou renovacao de convenio
    const updateData =
      patient.activeAt === null
        ? {
            activeAt: now,
            isActive: true,
            expirationDate: newExpirationDate,
            updatedAt: now,
          }
        : patient.expirationDate && patient.expirationDate > now
          ? {
              // Atualizar a data de expiração antecipada
              expirationDate: newExpirationDateAntecipated,
              reactivatedAt: now,
              isActive: true,
              updatedAt: now,
            }
          : {
              // Atualizar a data de expiração
              expirationDate: newExpirationDate,
              reactivatedAt: now,
              isActive: true,
              updatedAt: now,
            };

    // Atualizar o paciente
    await db
      .update(patientsTable)
      .set(updateData)
      .where(eq(patientsTable.id, parsedInput.patientId));

    // Buscar nome da clínica para incluir na mensagem
    let clinicName: string | undefined;
    if (patient.clinicId) {
      const clinicResult = await db
        .select({ name: clinicsTable.name })
        .from(clinicsTable)
        .where(eq(clinicsTable.id, patient.clinicId))
        .limit(1);
      clinicName = clinicResult[0]?.name;
    }

    // Determinar tipo de mensagem baseado no tipo de ativação
    let messageType: "activation" | "renewal" | "early_renewal";
    if (patient.activeAt === null) {
      messageType = "activation";
    } else if (patient.expirationDate && patient.expirationDate > now) {
      messageType = "early_renewal";
    } else {
      messageType = "renewal";
    }

    // Obter data de expiração final (a que foi salva no banco)
    const finalExpirationDate =
      messageType === "activation"
        ? newExpirationDate
        : messageType === "early_renewal"
          ? newExpirationDateAntecipated
          : newExpirationDate;

    // Preparar template do WhatsApp com parâmetros
    const templateConfig = getTemplateConfig(messageType, {
      patientName: patient.name,
      expirationDate: finalExpirationDate,
      clinicName,
    });

    // Enviar WhatsApp usando template pré-aprovado (não bloqueia o processo)
    // Se falhar, será logado mas não impedirá a ativação
    sendWhatsAppTemplateAsync({
      phoneNumber: patient.phoneNumber,
      templateName: templateConfig.name,
      parameters: templateConfig.parameters,
    }).catch((error) => {
      // Log do erro mas não propaga (não deve falhar a ativação)
      console.error(
        `Erro ao enviar WhatsApp template para paciente ${patient.id}:`,
        error,
      );
    });

    revalidatePath("/patients");
    revalidatePath("/vendedor/patients-seller");
    revalidatePath("/gerente/patients-gestor");

    return { success: true };
  });
