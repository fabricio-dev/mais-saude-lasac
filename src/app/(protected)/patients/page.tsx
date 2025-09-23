import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { patientsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddPatientButton from "./_components/add-patient-button";
import ListExpiredButton from "./_components/list-expired-button";
import PatientsTable from "./_components/patients-table";
import SearchPatients from "./_components/search-patients";

interface PatientsPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
  }>;
}

const PatientsPage = async ({ searchParams }: PatientsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  if (session.user.role !== "admin") {
    redirect("/vendedor/dashboard-seller");
  }

  // Aguardar searchParams antes de usar
  const { search, filter } = await searchParams;
  const isShowingExpired = filter === "expired";

  // Primeiro, buscar todas as clínicas do usuário
  const userClinics = await db
    .select({ clinicId: usersToClinicsTable.clinicId })
    .from(usersToClinicsTable)
    .where(eq(usersToClinicsTable.userId, session.user.id));

  const clinicIds = userClinics.map((uc) => uc.clinicId);

  // Se o usuário não tem clínicas, redirecionar para criar uma
  if (clinicIds.length === 0) {
    redirect("/clinics");
  }

  // Construir as condições de busca
  const searchTerm = search?.trim();

  // Condição base: filtrar pacientes por clínicas do usuário admin
  const baseCondition = inArray(patientsTable.clinicId, clinicIds);

  let whereCondition: SQL<unknown> = baseCondition;

  // Aplicar filtro de vencidos se necessário
  if (isShowingExpired) {
    whereCondition = and(
      baseCondition,
      isNotNull(patientsTable.expirationDate),
      lte(patientsTable.expirationDate, new Date()),
    )!;
  }

  // Aplicar filtro de busca por texto
  if (searchTerm) {
    // Normalizar termo de busca removendo acentos e espaços extras
    const normalizedSearchTerm = searchTerm
      .trim()
      .replace(/\s+/g, " ") // Normalizar espaços múltiplos para um único espaço
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    // Também criar versão com espaços normalizados mas com acentos
    const spacesNormalizedTerm = searchTerm.trim().replace(/\s+/g, " ");

    const searchConditions = or(
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
    )!;

    whereCondition = and(whereCondition, searchConditions)!;
  }

  // Buscar todos os pacientes das clínicas do usuário admin
  const patients = await db.query.patientsTable.findMany({
    where: whereCondition,
    with: {
      seller: true,
      clinic: true,
    },
    orderBy: (patients, { desc }) => [
      isShowingExpired ? desc(patients.activeAt) : desc(patients.updatedAt),
    ],
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {isShowingExpired ? "Pacientes Vencidos" : "Pacientes"}
          </PageTitle>
          <PageDescription>
            {isShowingExpired
              ? "Pacientes com data de expiração vencida"
              : "Gerencie todos os pacientes"}
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          {clinicIds.length > 0 && (
            <div className="flex gap-2">
              <ListExpiredButton />
              <AddPatientButton />
            </div>
          )}
        </PageActions>
      </PageHeader>
      <PageContent>
        {clinicIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Nenhuma clínica cadastrada
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Você precisa cadastrar pelo menos uma clínica antes de gerenciar
              pacientes.
            </p>
            <Button className="mt-4" asChild>
              <a href="/clinics">Cadastrar Clínica</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Suspense fallback={<div>Carregando...</div>}>
                <SearchPatients />
              </Suspense>
            </div>

            <div className="w-full">
              <PatientsTable
                patients={patients.map((patient) => ({
                  ...patient,
                  birthDate: patient.birthDate
                    ? new Date(patient.birthDate)
                    : null,
                }))}
              />
            </div>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const PatientsPageWrapper = (props: PatientsPageProps) => {
  return (
    <Suspense fallback={<div>Carregando pacientes...</div>}>
      <PatientsPage {...props} />
    </Suspense>
  );
};

export default PatientsPageWrapper;
