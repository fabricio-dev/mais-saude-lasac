import { eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";

export async function consultarPacientes(termo: string) {
  try {
    // Remove formatação do CPF (se for CPF)
    const cpfLimpo = termo.replace(/\D/g, "");

    // Consulta no banco usando Drizzle - busca por CPF ou nome
    const pacientesEncontrados = await db
      .select()
      .from(patientsTable)
      .where(
        or(
          eq(patientsTable.cpfNumber, cpfLimpo),
          ilike(patientsTable.name, `%${termo}%`),
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
