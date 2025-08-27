import { and, eq, ilike, isNotNull, lte, or } from "drizzle-orm";
import { headers } from "next/headers";
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
import { db } from "@/db";
import { patientsTable, sellersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import GenerateLinkButton from "../../_components/generate-link-button";
import AddPatientButton from "./_components/add-patient-button";
import ListExpiredButton from "./_components/list-expired-button";
import PatientsTable from "./_components/patients-table";
import SearchPatients from "./_components/search-patients";

interface PatientsSellerPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
  }>;
}

const PatientsSellerPage = async ({
  searchParams,
}: PatientsSellerPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (session.user.role !== "user") {
    redirect("/dashboard");
  }

  // Aguardar searchParams antes de usar
  const { search, filter } = await searchParams;
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

  let whereCondition = eq(patientsTable.sellerId, seller.id);

  // Aplicar filtro de vencidos se necessário
  if (isShowingExpired) {
    whereCondition = and(
      eq(patientsTable.sellerId, seller.id),
      isNotNull(patientsTable.expirationDate),
      lte(patientsTable.expirationDate, new Date()),
    )!;
  }

  // Aplicar filtro de busca por texto
  if (searchTerm) {
    const searchConditions = or(
      ilike(patientsTable.name, `%${searchTerm}%`),
      ilike(patientsTable.cpfNumber, `%${searchTerm}%`),
      ilike(patientsTable.rgNumber, `%${searchTerm}%`),
      ilike(patientsTable.phoneNumber, `%${searchTerm}%`),
      ilike(patientsTable.city, `%${searchTerm}%`),
    );

    whereCondition = and(whereCondition, searchConditions)!;
  }

  // Buscar pacientes do vendedor
  const patients = await db.query.patientsTable.findMany({
    where: whereCondition,
    with: {
      seller: true,
    },
    orderBy: (patients, { desc, asc }) => [
      isShowingExpired
        ? asc(patients.expirationDate)
        : desc(patients.createdAt),
    ],
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
              patients={patients.map((patient) => ({
                ...patient,
                birthDate: new Date(patient.birthDate),
              }))}
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
