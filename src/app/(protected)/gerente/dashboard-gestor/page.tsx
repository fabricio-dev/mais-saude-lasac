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
import { getDashboardGestor } from "@/data/get-dashboard-gestor";
import { formatCurrencyInCents } from "@/helpers/currency";
import { auth } from "@/lib/auth";

import { patientsTableColumnsSimple } from "../../patients/_components/table-columns";
import { ConveniosChart } from "./_components/convenios-chart";
import { DatePicker } from "./_components/date-picker";
import StatsCards from "./_components/stats-cards";
import TopSellers from "./_components/top-sellers";

interface DashboardGestorPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

export default async function DashboardGestor({
  searchParams,
}: DashboardGestorPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (session.user.role !== "gestor") {
    if (session.user.role === "admin") {
      redirect("/dashboard");
    } else {
      redirect("/vendedor/dashboard-seller");
    }
  }

  // if (!session?.user.clinic) {
  //   redirect("/clinics");
  // }

  const { from, to } = await searchParams;

  if (!from || !to) {
    redirect(
      `/gerente/dashboard-gestor?from=${dayjs().subtract(1, "month").add(1, "day").format("YYYY-MM-DD")}&to=${dayjs().add(1, "day").format("YYYY-MM-DD")}`,
    );
  }

  const {
    totalPatients,
    totalPatientsRenovated,
    totalSellers,
    topSellers,
    patientsToExpire,
    dailyConveniosData,
    totalEnterprise,
    totalEnterpriseRenovated,
    gestorClinic,
  } = await getDashboardGestor({
    from,
    to,
    session: {
      user: { id: session.user.id, email: session.user.email },
    },
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard Gestor</PageTitle>
          <PageDescription>
            Bem-vindo ao painel de gestão. Acompanhe o desempenho da sua unidade
            e vendedores.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
        </PageActions>
      </PageHeader>
      <PageContent>
        <StatsCards
          totalRevenue={formatCurrencyInCents(
            totalPatients.total + totalPatientsRenovated.total,
            totalEnterprise.total + totalEnterpriseRenovated.total,
          )}
          totalPatients={totalPatients.total + totalPatientsRenovated.total}
          totalSellers={totalSellers.total}
          gestorClinic={gestorClinic}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <ConveniosChart dailyConveniosData={dailyConveniosData} />
          <TopSellers sellers={topSellers} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="text-sm" />
                <CardTitle className="text-base">Convênios a vencer</CardTitle>
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
        </div>
      </PageContent>
    </PageContainer>
  );
}
