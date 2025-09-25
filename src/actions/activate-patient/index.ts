"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable, sellersTable, usersToClinicsTable } from "@/db/schema";
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

    // Calcular nova data de expiração (data atual + 1 ano)
    const newExpirationDate = dayjs()
      .add(1, "year")
      .startOf("day")
      .add(3, "hours")
      .toDate();

    const timeRemaining =
      dayjs(patient.expirationDate).diff(dayjs(), "days") + 1; //ver isso depois
    const newExpirationDateAntecipated = dayjs()
      .add(1, "year")
      .add(timeRemaining, "days")
      .startOf("day")
      .add(3, "hours")
      .toDate();

    // Determinar se é primeira ativação ou renovacao de convenio
    const updateData =
      patient.activeAt === null // ver se eh aoto cadastro
        ? {
            activeAt: dayjs().startOf("day").add(3, "hours").toDate(),
            isActive: true,
            expirationDate: newExpirationDate,
            updatedAt: new Date(),
          }
        : patient.expirationDate && patient.expirationDate > new Date()
          ? {
              // Atualizar a data de expiração antecipada
              expirationDate: newExpirationDateAntecipated,
              reactivatedAt: dayjs().startOf("day").add(3, "hours").toDate(),
              isActive: true,
              updatedAt: new Date(),
            }
          : {
              // Atualizar a data de expiração
              expirationDate: newExpirationDate,
              reactivatedAt: dayjs().startOf("day").add(3, "hours").toDate(),
              isActive: true,
              updatedAt: new Date(),
            };

    // Atualizar o paciente
    await db
      .update(patientsTable)
      .set(updateData)
      .where(eq(patientsTable.id, parsedInput.patientId));

    revalidatePath("/patients");
    revalidatePath("/vendedor/patients-seller");
    revalidatePath("/gerente/patients-gestor");

    return { success: true };
  });
