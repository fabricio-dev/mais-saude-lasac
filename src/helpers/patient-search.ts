import { ilike, or, type SQL, sql } from "drizzle-orm";

import { patientsTable } from "@/db/schema";

/**
 * Monta a condição de busca textual da listagem de pacientes.
 * CPF e telefone são comparados só pelos dígitos, para que a busca funcione
 * com ou sem máscara (ex.: "123.456.789-00" ou "(11) 98765-4321").
 */
export const buildPatientSearchCondition = (searchTerm: string): SQL => {
  // Normalizar termo de busca removendo acentos e espaços extras
  const normalizedSearchTerm = searchTerm
    .trim()
    .replace(/\s+/g, " ") // Normalizar espaços múltiplos para um único espaço
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  // Também criar versão com espaços normalizados mas com acentos
  const spacesNormalizedTerm = searchTerm.trim().replace(/\s+/g, " ");

  // Só os dígitos do termo, para casar CPF e telefone independente da máscara
  const digitsSearchTerm = searchTerm.replace(/\D/g, "");

  return or(
    // Busca normal (com acentos)
    ilike(patientsTable.name, `%${searchTerm}%`),
    ilike(patientsTable.cpfNumber, `%${searchTerm}%`),
    ilike(patientsTable.rgNumber, `%${searchTerm}%`),
    ilike(patientsTable.phoneNumber, `%${searchTerm}%`),
    ilike(patientsTable.city, `%${searchTerm}%`),
    // Busca com espaços normalizados
    ilike(patientsTable.name, `%${spacesNormalizedTerm}%`),
    ilike(patientsTable.city, `%${spacesNormalizedTerm}%`),
    // Busca sem acentos usando translate (compatível com PostgreSQL)
    sql`lower(translate(regexp_replace(${patientsTable.name}, '\\s+', ' ', 'g'), 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ', 'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeeCcIIIIiiiiUUUUuuuuyNn')) ilike '%' || lower(${normalizedSearchTerm}) || '%'`,
    sql`lower(translate(regexp_replace(${patientsTable.city}, '\\s+', ' ', 'g'), 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ', 'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeeCcIIIIiiiiUUUUuuuuyNn')) ilike '%' || lower(${normalizedSearchTerm}) || '%'`,
    // Busca por dígitos (CPF/telefone com ou sem máscara, no termo ou no banco)
    ...(digitsSearchTerm
      ? [
          sql`regexp_replace(${patientsTable.cpfNumber}, '\\D', '', 'g') like ${`%${digitsSearchTerm}%`}`,
          sql`regexp_replace(${patientsTable.phoneNumber}, '\\D', '', 'g') like ${`%${digitsSearchTerm}%`}`,
        ]
      : []),
  )!;
};
