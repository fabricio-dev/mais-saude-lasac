import dayjs from "dayjs";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
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

  const [[totalPatients], [totalSellers], [totalClinics], topSellers] =
    await Promise.all([
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
      db
        .select({
          id: sellersTable.id,
          name: sellersTable.name,
          avatarImageUrl: sellersTable.avatarImageUrl,
          clinic: sql<string>`${sellersTable.clinicId}`.as("clinic"),
          convenios: count(patientsTable.id),
        })
        .from(sellersTable)
        .leftJoin(
          patientsTable,
          and(
            eq(sellersTable.id, patientsTable.sellerId),
            gte(patientsTable.createdAt, new Date(from)),
            lte(patientsTable.createdAt, new Date(to)),
          ),
        )
        .where(eq(sellersTable.clinicId, session.user.clinic.id))
        .groupBy(sellersTable.id)
        .orderBy(desc(count(patientsTable.id)))
        .limit(5),
    ]);

  const chartSatartDate = dayjs().subtract(10, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();

  const dailyConveniosData = await db
    .select({
      date: sql<string>`DATE(${patientsTable.createdAt})`.as("date"),
      convenios: count(patientsTable.id),
      faturamento: sql<number>`COALESCE(COUNT(${patientsTable.id}), 0)`.as(
        "faturamento",
      ),
    })
    .from(patientsTable)
    .where(
      and(
        eq(patientsTable.clinicId, session.user.clinic.id),
        gte(patientsTable.createdAt, chartSatartDate),
        lte(patientsTable.createdAt, chartEndDate),
      ),
    )
    .groupBy(sql<string>`DATE(${patientsTable.createdAt})`)
    .orderBy(sql<string>`DATE(${patientsTable.createdAt})`);

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
          totalRevenue={
            totalPatients.total ? Number(totalPatients.total) * 100 : null
          }
          totalPatients={totalPatients.total}
          totalSellers={totalSellers.total}
          totalClinics={totalClinics.total}
        />
        <div className="grid grid-cols-[2.2fr_1fr] gap-4">
          <ConveniosChart dailyConveniosData={dailyConveniosData} />
          <TopSellers sellers={topSellers} />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
