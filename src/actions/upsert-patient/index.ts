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
  whatsappNotificationsTable,
} from "@/db/schema";
import { telefoneMudou } from "@/helpers/phone-core";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { sendPatientConfirmation } from "@/lib/whatsapp/patient-confirmation";

import { upsertPatientSchema } from "./schema";

// Configurar plugins do dayjs para lidar corretamente com fusos horários
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Até quantos dias depois da ativação ou renovação a troca de telefone manda o
 * aviso "telefone atualizado". É o caso do número errado no balcão: a
 * confirmação foi para outro número e o paciente ficou sem a lista. Depois
 * disso, a troca costuma vir junto de uma renovação, que já manda a própria
 * confirmação — o aviso chegaria repetido logo antes dela.
 */
const PHONE_UPDATE_WINDOW_DAYS = 7;

async function getClinicName(clinicId: string | null | undefined) {
  if (!clinicId) return undefined;
  const [clinic] = await db
    .select({ name: clinicsTable.name })
    .from(clinicsTable)
    .where(eq(clinicsTable.id, clinicId))
    .limit(1);
  return clinic?.name;
}

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
      const patientId = parsedInput.id;
      // Edição - verificar se paciente já foi reativado
      const existingPatient = await db.query.patientsTable.findFirst({
        where: eq(patientsTable.id, patientId),
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

      // Número novo de verdade (não só máscara ou nono dígito): os lembretes
      // são zerados para o cron mandar de novo, agora para o número certo.
      const isPhoneChanged =
        !!existingPatient &&
        telefoneMudou(existingPatient.phoneNumber, parsedInput.phoneNumber);

      await db.transaction(async (tx) => {
        await tx
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

        if (isPhoneChanged) {
          await tx
            .delete(whatsappNotificationsTable)
            .where(eq(whatsappNotificationsTable.patientId, patientId));
        }
      });

      if (existingPatient && isPhoneChanged) {
        const savedExpiration = patientData.expirationDate
          ? convertToUTCDate(patientData.expirationDate)
          : existingPatient.expirationDate;
        const lastActivation = [
          contractDateData.activeAt ?? existingPatient.activeAt,
          contractDateData.reactivatedAt ?? existingPatient.reactivatedAt,
        ]
          .filter((date): date is Date => !!date)
          .sort((a, b) => b.getTime() - a.getTime())[0];
        const today = dayjs().tz("America/Sao_Paulo").startOf("day");
        const isRecentActivation =
          !!lastActivation &&
          today.diff(
            dayjs(lastActivation).tz("America/Sao_Paulo").startOf("day"),
            "day",
          ) <= PHONE_UPDATE_WINDOW_DAYS;

        if (
          existingPatient.isActive &&
          savedExpiration &&
          savedExpiration > new Date() &&
          isRecentActivation
        ) {
          await sendPatientConfirmation({
            patientId,
            patientName: parsedInput.name,
            phoneNumber: parsedInput.phoneNumber,
            type: "phone_updated",
            expirationDate: savedExpiration,
            clinicName: await getClinicName(parsedInput.clinicId),
          });
        }
      }
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

      const [created] = await db
        .insert(patientsTable)
        .values(newPatientData)
        .returning({ id: patientsTable.id });

      // Enviar WhatsApp de boas-vindas para o novo paciente
      await sendPatientConfirmation({
        patientId: created.id,
        patientName: parsedInput.name,
        phoneNumber: parsedInput.phoneNumber,
        type: "activation",
        expirationDate,
        clinicName: await getClinicName(parsedInput.clinicId),
      });
    }

    revalidatePath("/patients");
    revalidatePath("/vendedor/patients-seller");
    revalidatePath("/gerente/patients-gestor");
  });
//CRIAR FUNCAO QUE É CHAMADA PARA ANVIAR MENSAGEM DE WHATSAPP PARA O CLIENTE
