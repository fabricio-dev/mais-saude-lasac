"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { returnValidationErrors } from "next-safe-action";

import { findPatientByPhone } from "@/data/find-patient-by-phone";
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
      whatsappConsent,
    } = parsedInput;

    // Verificar se CPF já existe (apenas se CPF foi fornecido)
    let cleanCPF = null;
    if (cpfNumber && cpfNumber.trim() !== "") {
      cleanCPF = cpfNumber.replace(/\D/g, "");
      const existingPatient = await db
        .select()
        .from(patientsTable)
        .where(eq(patientsTable.cpfNumber, cleanCPF))
        .limit(1);

      if (existingPatient.length > 0) {
        throw new Error("Este CPF já está cadastrado no sistema");
      }
    }

    // Telefone duplicado. A mensagem não diz de quem é o número: este cadastro
    // é público, e o nome do titular não pode vazar para quem digitar o telefone.
    if (await findPatientByPhone(phoneNumber)) {
      returnValidationErrors(createPatientSchema, {
        phoneNumber: {
          _errors: [
            "Este telefone já está cadastrado. Para renovar ou alterar seu convênio, fale com a clínica.",
          ],
        },
      });
    }

    // Criar paciente sem vendedor e clínica (será atribuído posteriormente)
    await db.insert(patientsTable).values({
      name,
      birthDate: birthDate
        ? dayjs(birthDate).startOf("day").toISOString()
        : null,
      phoneNumber,
      rgNumber: rgNumber || null,
      cpfNumber: cleanCPF,
      address: address || null,
      homeNumber: homeNumber || null,
      city: city || null,
      state: state || null,
      cardType,
      Enterprise: Enterprise || null,
      numberCards: numberCards ? parseInt(numberCards) : null,
      sellerId: parsedInput.sellerId,
      clinicId: parsedInput.clinicId,
      observation: observation || null,
      dependents1: dependents1 || null,
      dependents2: dependents2 || null,
      dependents3: dependents3 || null,
      dependents4: dependents4 || null,
      dependents5: dependents5 || null,
      dependents6: dependents6 || null,
      whatsappConsent: whatsappConsent ?? false,
      isActive: false, // Inativo até ser processado
      expirationDate: dayjs()
        .subtract(1, "day")
        .startOf("day")
        .add(6, "hours")
        .toDate(), // Será definido posteriormente
    });

    revalidatePath("/");
  });
