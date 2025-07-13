"use server";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable, sellersTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { deletePatientSchema } from "./schema";

export const deletePatient = actionClient
  .schema(deletePatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Buscar as clínicas do usuário
    const userClinics = await db
      .select({ clinicId: usersToClinicsTable.clinicId })
      .from(usersToClinicsTable)
      .where(eq(usersToClinicsTable.userId, session.user.id));

    const clinicIds = userClinics.map((uc) => uc.clinicId);

    if (clinicIds.length === 0) {
      throw new Error("Você não tem permissão para deletar este paciente");
    }

    // Buscar vendedores das clínicas do usuário
    const sellers = await db
      .select({ id: sellersTable.id })
      .from(sellersTable)
      .where(inArray(sellersTable.clinicId, clinicIds));

    const sellerIds = sellers.map((s) => s.id);

    const patient = await db.query.patientsTable.findFirst({
      where: eq(patientsTable.id, parsedInput.id),
    });

    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    // Verificar se o paciente pertence a um vendedor das clínicas do usuário
    if (!patient.sellerId || !sellerIds.includes(patient.sellerId)) {
      throw new Error("Você não tem permissão para deletar este paciente");
    }

    await db.delete(patientsTable).where(eq(patientsTable.id, parsedInput.id));
    revalidatePath("/patients");
  });
