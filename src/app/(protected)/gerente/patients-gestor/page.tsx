import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  and,
  between,
  desc,
  eq,
  gte,
  isNotNull,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Configurar plugins do dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getPatientsPage, parsePageParam } from "@/data/get-patients-page";
import { db } from "@/db";
import { patientsTable, sellersTable } from "@/db/schema";
import { buildPatientSearchCondition } from "@/helpers/patient-search";
import { requireRole } from "@/lib/require-role";

import GenerateLinkButton from "../../_components/generate-link-button";
import AddPatientButton from "./_components/add-patient-button";
import FiltersBar from "./_components/filters-bar";
import PatientsTable from "./_components/patients-table";
import SearchPatients from "./_components/search-patients";

interface PatientsGestorPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

const PatientsGestorPage = async ({
  searchParams,
}: PatientsGestorPageProps) => {
  const session = await requireRole("gestor");

  // Aguardar searchParams antes de usar
  const { search, filter, dateFrom, dateTo, page } = await searchParams;
  const isShowingExpired = filter === "expired";

  // Buscar o gestor na tabela de vendedores para obter a clínica
  const gestor = await db.query.sellersTable.findFirst({
    where: eq(sellersTable.email, session.user.email),
    with: {
      clinic: true,
    },
  });

  if (!gestor || !gestor.clinic || !gestor.clinicId) {
    redirect("/authentication");
  }

  // Construir as condições de busca - filtrar por clínica do gestor
  const searchTerm = search?.trim();

  let whereCondition: SQL<unknown> | undefined;

  // Aplicar filtro de vencidos se necessário
  if (isShowingExpired) {
    whereCondition = and(
      //eq(patientsTable.clinicId, gestor.clinicId),
      isNotNull(patientsTable.expirationDate),
      lte(patientsTable.expirationDate, new Date()),
    )!;
  }

  // Aplicar filtro por período de data de vencimento
  // Interpreta as datas como horário de São Paulo e converte para UTC
  // O DatePicker já envia as datas com horas (formato: YYYY-MM-DD HH:mm:ss)
  if (dateFrom && dateTo) {
    const fromDate = dayjs.tz(dateFrom, "America/Sao_Paulo").utc().toDate();
    const toDate = dayjs.tz(dateTo, "America/Sao_Paulo").utc().toDate();

    const dateCondition = and(
      isNotNull(patientsTable.expirationDate),
      between(patientsTable.expirationDate, fromDate, toDate),
    )!;

    whereCondition = whereCondition
      ? and(whereCondition, dateCondition)!
      : dateCondition;
  } else if (dateFrom) {
    const fromDate = dayjs.tz(dateFrom, "America/Sao_Paulo").utc().toDate();
    const dateCondition = and(
      isNotNull(patientsTable.expirationDate),
      gte(patientsTable.expirationDate, fromDate),
    )!;

    whereCondition = whereCondition
      ? and(whereCondition, dateCondition)!
      : dateCondition;
  } else if (dateTo) {
    const toDate = dayjs.tz(dateTo, "America/Sao_Paulo").utc().toDate();
    const dateCondition = and(
      isNotNull(patientsTable.expirationDate),
      lte(patientsTable.expirationDate, toDate),
    )!;

    whereCondition = whereCondition
      ? and(whereCondition, dateCondition)!
      : dateCondition;
  }

  // Aplicar filtro de busca por texto
  if (searchTerm) {
    const searchConditions = buildPatientSearchCondition(searchTerm);

    whereCondition = whereCondition
      ? and(whereCondition, searchConditions)!
      : searchConditions;
  }

  // Pacientes da clínica do gestor primeiro, depois os das outras clínicas
  const ownClinicFirst = sql`case when ${patientsTable.clinicId} = ${gestor.clinicId} then 0 else 1 end`;
  const statusOrder = isShowingExpired
    ? [
        // Vencidos: nunca ativados (pendentes) primeiro, depois os de ativação mais recente
        sql`${patientsTable.activeAt} desc nulls first`,
        desc(patientsTable.updatedAt),
      ]
    : [desc(patientsTable.updatedAt)];

  // Buscar só a página atual
  const { patients, totalCount, totalPages, currentPage } =
    await getPatientsPage({
      where: whereCondition,
      orderBy: [ownClinicFirst, ...statusOrder],
      page: parsePageParam(page),
    });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {isShowingExpired ? "Convênios Vencidos" : "Convênios "}
          </PageTitle>
          <PageDescription>
            {isShowingExpired
              ? "Convênios com data de expiração vencida ou pendentes."
              : `Gerencie os convênios.`}
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <GenerateLinkButton
                sellerId={gestor.id}
                sellerName={gestor.name}
              />
              <Suspense fallback={<div>Carregando...</div>}>
                <FiltersBar />
              </Suspense>
              <AddPatientButton
                sellerId={gestor.id}
                clinicId={gestor.clinicId!}
              />
            </div>
          </div>
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Suspense fallback={<div>Carregando...</div>}>
              <SearchPatients />
            </Suspense>
          </div>

          <div className="w-full">
            <PatientsTable
              patients={patients}
              totalCount={totalCount}
              currentPage={currentPage}
              totalPages={totalPages}
              gestorClinicId={gestor.clinicId!}
            />
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const PatientsGestorPageWrapper = (props: PatientsGestorPageProps) => {
  return (
    <Suspense fallback={<div>Carregando pacientes...</div>}>
      <PatientsGestorPage {...props} />
    </Suspense>
  );
};

export default PatientsGestorPageWrapper;
