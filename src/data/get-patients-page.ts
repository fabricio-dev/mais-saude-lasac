import { count, desc, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";

export const PATIENTS_PAGE_SIZE = 12;

/**
 * Converte o parâmetro "page" da URL (1-based) em número,
 * caindo para a primeira página quando vier vazio ou inválido.
 */
export const parsePageParam = (page?: string) => {
  const parsedPage = Number(page);
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
};

interface GetPatientsPageParams {
  where?: SQL;
  orderBy: SQL[];
  page: number;
}

/**
 * Busca uma página da listagem de pacientes.
 * Filtro e ordenação ficam a cargo de cada papel (admin, gerente, vendedor);
 * aqui só se pagina e se traz o que as tabelas usam: o paciente completo
 * (edição e impressão precisam de todos os campos) e o nome do vendedor e da clínica.
 */
export const getPatientsPage = async ({
  where,
  orderBy,
  page,
}: GetPatientsPageParams) => {
  const fetchPatients = (pageNumber: number) =>
    db.query.patientsTable.findMany({
      where,
      with: {
        seller: { columns: { name: true } },
        clinic: { columns: { name: true } },
      },
      // id como desempate garante que a mesma linha não apareça em duas páginas
      orderBy: [...orderBy, desc(patientsTable.id)],
      limit: PATIENTS_PAGE_SIZE,
      offset: (pageNumber - 1) * PATIENTS_PAGE_SIZE,
    });

  const [[{ totalCount }], requestedPagePatients] = await Promise.all([
    db.select({ totalCount: count() }).from(patientsTable).where(where),
    fetchPatients(page),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PATIENTS_PAGE_SIZE));

  // Página além do fim (ex.: após excluir o último paciente dela): mostra a última
  const currentPage = Math.min(page, totalPages);
  const patients =
    currentPage === page
      ? requestedPagePatients
      : await fetchPatients(currentPage);

  return {
    patients: patients.map((patient) => ({
      ...patient,
      birthDate: patient.birthDate ? new Date(patient.birthDate) : null,
    })),
    totalCount,
    totalPages,
    currentPage,
  };
};
