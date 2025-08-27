import { eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";

export async function consultarPacientes(termo: string) {
  try {
    // Remove formatação do CPF (se for CPF)
    const cpfLimpo = termo.replace(/\D/g, "");

    // Consulta no banco usando Drizzle - busca por CPF, nome do titular ou nome dos dependentes
    const pacientesEncontrados = await db
      .select()
      .from(patientsTable)
      .where(
        or(
          eq(patientsTable.cpfNumber, cpfLimpo),
          ilike(patientsTable.name, `%${termo}%`),
          ilike(patientsTable.dependents1, `%${termo}%`),
          ilike(patientsTable.dependents2, `%${termo}%`),
          ilike(patientsTable.dependents3, `%${termo}%`),
          ilike(patientsTable.dependents4, `%${termo}%`),
          ilike(patientsTable.dependents5, `%${termo}%`),
          ilike(patientsTable.dependents6, `%${termo}%`),
        ),
      );

    return {
      success: true,
      data: pacientesEncontrados,
    };
  } catch (error) {
    console.error("Erro ao consultar pacientes:", error);
    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}
