import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
    redirect("/vendedor/dashboard-seller");
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <ConveniosChart dailyConveniosData={dailyConveniosData} />
          <TopSellers sellers={topSellers} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="text-sm" />
                <CardTitle className="text-base">Convenios a vencer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
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

export default DashboardPage;
