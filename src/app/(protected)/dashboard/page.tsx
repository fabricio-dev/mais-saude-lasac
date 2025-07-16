import dayjs from "dayjs";
import { and, count, eq, gte, lte, sum } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
import { clinicsTable, patientsTable, sellersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { DatePicker } from "./_components/date-picker";
import StatsCards from "./_components/stats-cards";

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

  if (!session?.user.clinic) {
    redirect("/clinics");
  }
  const { from, to } = await searchParams;
  if (!from || !to) {
    redirect(
      `/dashboard?from=${dayjs().subtract(1, "month").add(1, "day").format("YYYY-MM-DD")}&to=${dayjs().add(1, "day").format("YYYY-MM-DD")}`,
    );
  }

  const [[totalRevenue], [totalPatients], [totalSellers], [totalClinics]] =
    await Promise.all([
      db
        .select({
          total: sum(patientsTable.numberCards),
        })
        .from(patientsTable)
        .where(
          and(
            eq(patientsTable.clinicId, session.user.clinic.id),
            gte(patientsTable.createdAt, new Date(from)),
            lte(patientsTable.createdAt, new Date(to)),
          ),
        ),
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            eq(patientsTable.clinicId, session.user.clinic.id),
            gte(patientsTable.createdAt, new Date(from)),
            lte(patientsTable.createdAt, new Date(to)),
          ),
        ),
      db
        .select({
          total: count(),
        })
        .from(sellersTable)
        .where(eq(sellersTable.clinicId, session.user.clinic.id)),
      db
        .select({
          total: count(),
        })
        .from(clinicsTable)
        .where(eq(clinicsTable.id, session.user.clinic.id)),
    ]);

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
          totalRevenue={totalRevenue.total ? Number(totalRevenue.total) : null}
          totalPatients={totalPatients.total}
          totalSellers={totalSellers.total}
          totalClinics={totalClinics.total}
        />
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
