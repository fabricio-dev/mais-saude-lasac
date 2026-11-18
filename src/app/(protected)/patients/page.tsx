import { desc, eq } from "drizzle-orm";
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
import { getPatientsPage, parsePageParam } from "@/data/get-patients-page";
import { db } from "@/db";
import { patientsTable, usersToClinicsTable } from "@/db/schema";
import { buildAdminPatientsCondition } from "@/helpers/admin-patients-condition";
import { requireRole } from "@/lib/require-role";

import AddPatientButton from "./_components/add-patient-button";
import ExportExpiredContactsButton from "./_components/export-expired-contacts-button";
import FiltersBar from "./_components/filters-bar";
import PatientsTable from "./_components/patients-table";
import SearchPatients from "./_components/search-patients";

interface PatientsPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

const PatientsPage = async ({ searchParams }: PatientsPageProps) => {
  const session = await requireRole("admin");

  // Aguardar searchParams antes de usar
  const { search, filter, dateFrom, dateTo, page } = await searchParams;
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

  const whereCondition = buildAdminPatientsCondition(clinicIds, {
    isShowingExpired,
    search,
    dateFrom,
    dateTo,
  });

  // Buscar só a página atual dos pacientes das clínicas do usuário admin
  const { patients, totalCount, totalPages, currentPage } =
    await getPatientsPage({
      where: whereCondition,
      orderBy: [
        isShowingExpired
          ? desc(patientsTable.expirationDate)
          : desc(patientsTable.updatedAt),
      ],
      page: parsePageParam(page),
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
            <div className="flex items-center gap-4">
              <Suspense fallback={<div>Carregando...</div>}>
                <FiltersBar />
              </Suspense>
              {isShowingExpired && (
                <ExportExpiredContactsButton
                  filters={{ search, dateFrom, dateTo }}
                  disabled={totalCount === 0}
                />
              )}
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
                patients={patients}
                totalCount={totalCount}
                currentPage={currentPage}
                totalPages={totalPages}
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
