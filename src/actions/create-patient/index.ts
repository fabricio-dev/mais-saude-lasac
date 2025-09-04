"use server";

import { subDays } from "date-fns";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

import { createPatientSchema } from "./schema";

export const createPatient = actionClient
  .schema(createPatientSchema)
  .action(async ({ parsedInput }) => {
    const {
      name,
      birthDate,
      phoneNumber,
      rgNumber,
      cpfNumber,
      address,
      homeNumber,
      city,
      state,
      cardType,
      Enterprise,
      numberCards,
      observation,
      dependents1,
      dependents2,
      dependents3,
      dependents4,
      dependents5,
      dependents6,
    } = parsedInput;

    // Verificar se CPF já existe
    const cleanCPF = cpfNumber.replace(/\D/g, "");
    const existingPatient = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.cpfNumber, cleanCPF))
      .limit(1);

    if (existingPatient.length > 0) {
      throw new Error("Este CPF já está cadastrado no sistema");
    }

    // Criar paciente sem vendedor e clínica (será atribuído posteriormente)
    await db.insert(patientsTable).values({
      name,
      birthDate: new Date(birthDate).toISOString().split("T")[0],
      phoneNumber,
      rgNumber,
      cpfNumber: cleanCPF,
      address,
      homeNumber,
      city,
      state,
      cardType,
      Enterprise: Enterprise || null,
      numberCards: parseInt(numberCards),
      sellerId: parsedInput.sellerId,
      clinicId: parsedInput.clinicId,
      observation: observation || null,
      dependents1: dependents1 || null,
      dependents2: dependents2 || null,
      dependents3: dependents3 || null,
      dependents4: dependents4 || null,
      dependents5: dependents5 || null,
      dependents6: dependents6 || null,
      isActive: false, // Inativo até ser processado
      expirationDate: subDays(new Date(), 1), // Será definido posteriormente
    });

    revalidatePath("/");
  });
