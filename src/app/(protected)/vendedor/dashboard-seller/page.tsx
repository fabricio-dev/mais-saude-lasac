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
import { getDashboardSellers } from "@/data/get-dashboard-sellers";
import { formatCurrencyInCents } from "@/helpers/currency";
import { auth } from "@/lib/auth";

import { patientsTableColumnsSimple } from "../../patients/_components/table-columns";
import { ConveniosChart } from "./_components/convenios-chart";
import { DatePicker } from "./_components/date-picker";
import StatsCards from "./_components/stats-cards";
import TopSellers from "./_components/top-sellers";

interface DashboardPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

// TODO: Verificar se o vendedor tem acesso ao dashboard

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  if (session.user.role !== "user") {
    redirect("/dashboard");
  }

  const { from, to } = await searchParams;

  if (!from || !to) {
    redirect(
      `/vendedor/dashboard-seller?from=${dayjs().subtract(1, "month").add(1, "day").format("YYYY-MM-DD")}&to=${dayjs().add(1, "day").format("YYYY-MM-DD")}`,
    );
  }

  const {
    totalPatients,
    sellerClinic,
    topSellers,
    patientsToExpire,
    dailyConveniosData,
    totalEnterprise,
  } = await getDashboardSellers({
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
          totalRevenue={formatCurrencyInCents(
            totalPatients.total,
            totalEnterprise.total,
          )}
          totalPatients={totalPatients.total}
          sellerClinic={sellerClinic}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
          <ConveniosChart dailyConveniosData={dailyConveniosData} />
          <TopSellers
            sellers={topSellers}
            currentSellerEmail={session.user.email}
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
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
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
