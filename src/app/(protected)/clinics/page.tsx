import { and, eq, ilike } from "drizzle-orm";
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
import { clinicsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddClinicButton from "./_components/add-clinic-button";
import ClinicCard from "./_components/clinic-card";
import SearchClinics from "./_components/search-clinics";

interface ClinicsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

const ClinicsPage = async ({ searchParams }: ClinicsPageProps) => {
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
  const { search } = await searchParams;
  const searchTerm = search?.trim();

  let whereCondition = eq(usersToClinicsTable.userId, session.user.id);

  if (searchTerm) {
    whereCondition = and(
      eq(usersToClinicsTable.userId, session.user.id),
      ilike(clinicsTable.name, `%${searchTerm}%`),
    ) as typeof whereCondition;
  }

  // Buscar clínicas do usuário
  const userClinics = await db
    .select({
      id: clinicsTable.id,
      name: clinicsTable.name,
      createdAt: clinicsTable.createdAt,
      updatedAt: clinicsTable.updatedAt,
    })
    .from(usersToClinicsTable)
    .innerJoin(clinicsTable, eq(usersToClinicsTable.clinicId, clinicsTable.id))
    .where(whereCondition);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Clínicas</PageTitle>
          <PageDescription>Gerencie as clínicas do seu sistema</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddClinicButton />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<div>Carregando...</div>}>
            <SearchClinics />
          </Suspense>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userClinics.length > 0 ? (
            userClinics.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))
          ) : (
            <div className="col-span-full py-8 text-center">
              <p className="text-gray-500">
                {searchTerm
                  ? `Nenhuma clínica encontrada para "${searchTerm}"`
                  : "Nenhuma clínica cadastrada"}
              </p>
            </div>
          )}
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const ClinicsPageWrapper = (props: ClinicsPageProps) => {
  return (
    <Suspense fallback={<div>Carregando clínicas...</div>}>
      <ClinicsPage {...props} />
    </Suspense>
  );
};

export default ClinicsPageWrapper;
