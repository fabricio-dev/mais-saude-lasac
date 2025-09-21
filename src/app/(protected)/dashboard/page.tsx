import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getDashboard } from "@/data/get-dashboard";
import { formatCurrencyInCents } from "@/helpers/currency";
import { auth } from "@/lib/auth";

import { patientsTableColumnsSimple } from "../patients/_components/table-columns";
import { ConveniosChart } from "./_components/convenios-chart";
import { DatePicker } from "./_components/date-picker";
import StatsCards from "./_components/stats-cards";
import TopClinics from "./_components/top-clinics";
import TopSellers from "./_components/top-sellers";

interface DashboardPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  if (session.user.role !== "admin") {
    if (session.user.role === "gestor") {
      redirect("/gerente/dashboard-gestor");
    } else {
      redirect("/vendedor/dashboard-seller");
    }
  }

  if (!session?.user.clinic) {
    redirect("/clinics");
  }
  const { from, to } = await searchParams;

  if (!from || !to) {
    redirect(
      `/dashboard?from=${dayjs().subtract(1, "month").add(1, "day").format("YYYY-MM-DD")}&to=${dayjs().add(1, "day").format("YYYY-MM-DD")}`,
    );
  }

  const {
    totalPatients,
    totalSellers,
    totalClinics,
    topSellers,
    topClinics,
    patientsToExpire,
    dailyConveniosData,
    totalEnterprise,
    totalPatientsRenovated,
    totalEnterpriseRenovated,
  } = await getDashboard({
    from,
    to,
    session: {
      user: { id: session.user.id, clinic: { id: session.user.clinic.id } },
    },
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            Bem-vindo ao sistema de gestão de convenios.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
        </PageActions>
      </PageHeader>
      <PageContent>
        <StatsCards
          // TODO: recebe total de pacientes subitrai os que sao empresas e multiplica por 100 e soma com o total de empresas que multiplica por 90
          totalRevenue={formatCurrencyInCents(
            totalPatients.total + totalPatientsRenovated.total,
            totalEnterprise.total + totalEnterpriseRenovated.total,
          )}
          totalPatients={totalPatients.total + totalPatientsRenovated.total}
          totalSellers={totalSellers.total}
          totalClinics={totalClinics.total}
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2.25fr_1fr]">
          <ConveniosChart dailyConveniosData={dailyConveniosData} />
          <TopSellers sellers={topSellers} />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" />
                <CardTitle className="text-base">Convenios a vencer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <DataTable
                columns={patientsTableColumnsSimple}
                data={patientsToExpire.map(
                  (patient: (typeof patientsToExpire)[0]) => ({
                    ...patient,
                    birthDate: new Date(patient.birthDate),
                  }),
                )}
              />
            </CardContent>
          </Card>
          <TopClinics topClinics={topClinics} />
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Componente de Loading
const DashboardLoading = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>Carregando dados do dashboard...</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200" />
        </PageActions>
      </PageHeader>
      <PageContent>
        {/* Stats Cards Loading */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="mb-1 h-8 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Loading */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table and Top Clinics Loading */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="text-sm" />
                <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const DashboardPageWrapper = (props: DashboardPageProps) => {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPage {...props} />
    </Suspense>
  );
};

export default DashboardPageWrapper;
