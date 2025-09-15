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

  let whereCondition;

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
    const searchConditions = or(
      ilike(patientsTable.name, `%${searchTerm}%`),
      ilike(patientsTable.cpfNumber, `%${searchTerm}%`),
      ilike(patientsTable.rgNumber, `%${searchTerm}%`),
      ilike(patientsTable.phoneNumber, `%${searchTerm}%`),
      ilike(patientsTable.city, `%${searchTerm}%`),
    );

    whereCondition = and(whereCondition, searchConditions)!;
  }

  // Buscar todos os pacientes
  const allPatients = await db.query.patientsTable.findMany({
    where: whereCondition,
    with: {
      seller: true,
      clinic: true,
    },
    orderBy: (patients, { desc }) => [
      isShowingExpired ? desc(patients.activeAt) : desc(patients.updatedAt),
    ],
  });

  // Separar por vendedor: logado vs outros
  const loggedSellerPatients = allPatients.filter(
    (patient) => patient.sellerId === seller.id,
  );
  const otherSellersPatients = allPatients.filter(
    (patient) => patient.sellerId !== seller.id,
  );

  // Função para ordenar pacientes vencidos (activeAt nulo primeiro)
  const sortExpiredPatients = (patients: typeof allPatients) => {
    if (!isShowingExpired) return patients;

    return patients.sort((a, b) => {
      // Se um tem activeAt nulo e outro não, nulo vem primeiro
      if (!a.activeAt && b.activeAt) return -1;
      if (a.activeAt && !b.activeAt) return 1;

      // Se ambos são nulos ou ambos têm valor, ordenar por updatedAt desc
      if (!a.activeAt && !b.activeAt) {
        return (
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
        );
      }

      // Se ambos têm activeAt, ordenar por activeAt desc
      return (
        new Date(b.activeAt || 0).getTime() -
        new Date(a.activeAt || 0).getTime()
      );
    });
  };

  // Aplicar ordenação especial para vencidos e combinar
  const sortedLoggedPatients = sortExpiredPatients(loggedSellerPatients);
  const sortedOtherPatients = sortExpiredPatients(otherSellersPatients);

  // Combinar: vendedor logado primeiro, depois outros
  const patients = [...sortedLoggedPatients, ...sortedOtherPatients];

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
