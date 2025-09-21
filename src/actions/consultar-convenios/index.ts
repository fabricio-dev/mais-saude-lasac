import { eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";

export async function consultarPacientes(termo: string) {
  try {
    // Remove formatação do CPF (se for CPF)
    const cpfLimpo = termo.replace(/\D/g, "");

    // Determina se o termo é um CPF válido (11 dígitos)
    const isCpfSearch = cpfLimpo.length === 11;

    let whereCondition;

    if (isCpfSearch) {
      // Busca por CPF: busca exata no campo CPF
      whereCondition = eq(patientsTable.cpfNumber, cpfLimpo);
    } else if (termo.trim().length >= 2) {
      // Busca por nome: busca em todos os campos de nome
      whereCondition = or(
        ilike(patientsTable.name, `%${termo.trim()}%`),
        ilike(patientsTable.dependents1, `%${termo.trim()}%`),
        ilike(patientsTable.dependents2, `%${termo.trim()}%`),
        ilike(patientsTable.dependents3, `%${termo.trim()}%`),
        ilike(patientsTable.dependents4, `%${termo.trim()}%`),
        ilike(patientsTable.dependents5, `%${termo.trim()}%`),
        ilike(patientsTable.dependents6, `%${termo.trim()}%`),
      );
    } else {
      // Termo muito curto, retorna array vazio
      return {
        success: true,
        data: [],
      };
    }

    // Consulta no banco usando Drizzle
    const pacientesEncontrados = await db
      .select()
      .from(patientsTable)
      .where(whereCondition)
      .limit(12);

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
