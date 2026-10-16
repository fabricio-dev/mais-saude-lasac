import { and, desc, eq, isNotNull, lte, type SQL, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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
import ListExpiredButton from "./_components/list-expired-button";
import PatientsTable from "./_components/patients-table";
import SearchPatients from "./_components/search-patients";

interface PatientsSellerPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    page?: string;
  }>;
}

const PatientsSellerPage = async ({
  searchParams,
}: PatientsSellerPageProps) => {
  const session = await requireRole("user");

  // Aguardar searchParams antes de usar
  const { search, filter, page } = await searchParams;
  const isShowingExpired = filter === "expired";

  // Buscar o vendedor logado
  const seller = await db.query.sellersTable.findFirst({
    where: eq(sellersTable.email, session.user.email),
  });

  if (!seller) {
    redirect("/authentication");
  }

  // Construir as condições de busca
  const searchTerm = search?.trim();

  let whereCondition: SQL<unknown> | undefined;

  // Aplicar filtro de vencidos se necessário se necessario listar somente os vencidos dele descomente o eq
  if (isShowingExpired) {
    whereCondition = and(
      //eq(patientsTable.sellerId, seller.id),
      isNotNull(patientsTable.expirationDate),
      lte(patientsTable.expirationDate, new Date()),
    )!;
  }

  // Aplicar filtro de busca por texto
  if (searchTerm) {
    const searchConditions = buildPatientSearchCondition(searchTerm);

    whereCondition = whereCondition
      ? and(whereCondition, searchConditions)!
      : searchConditions;
  }

  // Pacientes do vendedor logado primeiro, depois os dos outros vendedores
  const ownPatientsFirst = sql`case when ${patientsTable.sellerId} = ${seller.id} then 0 else 1 end`;
  const statusOrder = isShowingExpired
    ? [
        // Vencidos: nunca ativados (pendentes) primeiro, depois os de ativação mais recente
        sql`${patientsTable.activeAt} desc nulls first`,
        desc(patientsTable.updatedAt),
      ]
    : [desc(patientsTable.updatedAt)];

  // Buscar só a página atual
  const { patients, totalPages, currentPage } = await getPatientsPage({
    where: whereCondition,
    orderBy: [ownPatientsFirst, ...statusOrder],
    page: parsePageParam(page),
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            {isShowingExpired ? "Convenios Vencidos" : "Meus Convenios"}
          </PageTitle>
          <PageDescription>
            {isShowingExpired
              ? "Convenios com data de expiração vencida"
              : "Gerencie seus convenios"}
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <div className="flex gap-2">
            <GenerateLinkButton sellerId={seller.id} sellerName={seller.name} />
            <ListExpiredButton />
            <AddPatientButton
              sellerId={seller.id}
              clinicId={seller.clinicId!}
            />
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
              currentPage={currentPage}
              totalPages={totalPages}
              sellerId={seller.id}
              clinicId={seller.clinicId!}
            />
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const PatientsSellerPageWrapper = (props: PatientsSellerPageProps) => {
  return (
    <Suspense fallback={<div>Carregando pacientes...</div>}>
      <PatientsSellerPage {...props} />
    </Suspense>
  );
};

export default PatientsSellerPageWrapper;
