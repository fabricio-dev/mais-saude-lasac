import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  and,
  between,
  gte,
  inArray,
  isNotNull,
  lte,
  type SQL,
} from "drizzle-orm";

import { patientsTable } from "@/db/schema";
import { buildPatientSearchCondition } from "@/helpers/patient-search";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface AdminPatientsFilters {
  isShowingExpired: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Filtro da listagem de /patients (admin): clínicas do usuário, vencidos,
 * período de vencimento e busca. A tela e a exportação de contatos vencidos
 * usam a mesma condição, para o arquivo trazer exatamente o que a tela lista.
 */
export const buildAdminPatientsCondition = (
  clinicIds: string[],
  { isShowingExpired, search, dateFrom, dateTo }: AdminPatientsFilters,
): SQL => {
  // Condição base: filtrar pacientes por clínicas do usuário admin
  let whereCondition: SQL = inArray(patientsTable.clinicId, clinicIds);

  if (isShowingExpired) {
    whereCondition = and(
      whereCondition,
      isNotNull(patientsTable.expirationDate),
      lte(patientsTable.expirationDate, new Date()),
    )!;
  }

  // Período de vencimento: as datas vêm no horário de São Paulo
  // (o DatePicker envia "YYYY-MM-DD HH:mm:ss") e são convertidas para UTC
  const toUtcDate = (date: string) =>
    dayjs.tz(date, "America/Sao_Paulo").utc().toDate();

  if (dateFrom && dateTo) {
    whereCondition = and(
      whereCondition,
      isNotNull(patientsTable.expirationDate),
      between(
        patientsTable.expirationDate,
        toUtcDate(dateFrom),
        toUtcDate(dateTo),
      ),
    )!;
  } else if (dateFrom) {
    whereCondition = and(
      whereCondition,
      isNotNull(patientsTable.expirationDate),
      gte(patientsTable.expirationDate, toUtcDate(dateFrom)),
    )!;
  } else if (dateTo) {
    whereCondition = and(
      whereCondition,
      isNotNull(patientsTable.expirationDate),
      lte(patientsTable.expirationDate, toUtcDate(dateTo)),
    )!;
  }

  const searchTerm = search?.trim();
  if (searchTerm) {
    whereCondition = and(
      whereCondition,
      buildPatientSearchCondition(searchTerm),
    )!;
  }

  return whereCondition;
};
