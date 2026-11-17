"use server";

import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable, usersToClinicsTable } from "@/db/schema";
import { buildAdminPatientsCondition } from "@/helpers/admin-patients-condition";
import {
  buildContactsCsv,
  expiredContactsFileName,
} from "@/helpers/contacts-csv";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { normalizeRole } from "@/lib/role-access";

import { exportExpiredContactsSchema } from "./schema";

/**
 * CSV com telefone e nome de todos os pacientes vencidos do filtro de
 * /patients — todas as páginas, não só a que está na tela. Só para admin.
 */
export const exportExpiredContacts = actionClient
  .schema(exportExpiredContactsSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }
    if (normalizeRole(session.user.role) !== "admin") {
      throw new Error("Apenas administradores podem exportar contatos");
    }

    const userClinics = await db
      .select({ clinicId: usersToClinicsTable.clinicId })
      .from(usersToClinicsTable)
      .where(eq(usersToClinicsTable.userId, session.user.id));
    const clinicIds = userClinics.map((uc) => uc.clinicId);

    const contacts =
      clinicIds.length === 0
        ? []
        : await db
            .select({
              name: patientsTable.name,
              phoneNumber: patientsTable.phoneNumber,
            })
            .from(patientsTable)
            .where(
              buildAdminPatientsCondition(clinicIds, {
                ...parsedInput,
                isShowingExpired: true,
              }),
            )
            // Mesma ordem da tela de vencidos
            .orderBy(
              desc(patientsTable.expirationDate),
              desc(patientsTable.id),
            );

    return {
      fileName: expiredContactsFileName(),
      csv: buildContactsCsv(contacts),
      count: contacts.length,
    };
  });
