import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Configurar plugins do dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

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

import { DatePicker } from "../dashboard-gestor/_components/date-picker";
import AddSellerButton from "./_components/add-seller-button";
import SearchSellers from "./_components/search-sellers";
import SellerCard from "./_components/seller-card";

interface SellersGestorPageProps {
  searchParams: Promise<{
    search?: string;
    from?: string;
    to?: string;
  }>;
}

const SellersGestorPage = async ({ searchParams }: SellersGestorPageProps) => {
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

  // Aguardar searchParams antes de usar
  const { search, from, to } = await searchParams;

  if (!from || !to) {
    redirect(
      `/gerente/sellers-gestor?from=${dayjs().subtract(1, "month").format("YYYY-MM-DD")}&to=${dayjs().format("YYYY-MM-DD")}`,
    );
  }

  // Buscar o gestor na tabela de vendedores para obter a clínica
  const gestor = await db.query.sellersTable.findFirst({
    where: eq(sellersTable.email, session.user.email),
    with: {
      clinic: true,
    },
  });

  if (!gestor || !gestor.clinic || !gestor.clinicId) {
    redirect("/authentication");
  }

  const searchTerm = search?.trim();

  // Construir as condições de busca - filtrar apenas vendedores da mesma clínica
  let whereCondition = eq(sellersTable.clinicId, gestor.clinicId);
  if (searchTerm) {
    const searchConditions = or(
      ilike(sellersTable.name, `%${searchTerm}%`),
      ilike(sellersTable.cpfNumber, `%${searchTerm}%`),
      ilike(sellersTable.email, `%${searchTerm}%`),
      ilike(sellersTable.phoneNumber, `%${searchTerm}%`),
    );

    whereCondition = and(
      eq(sellersTable.clinicId, gestor.clinicId),
      searchConditions,
    ) as typeof whereCondition;
  }

  // Definindo datas e condições SQL considerando fuso horário brasileiro
  // Interpreta as datas como horário de São Paulo e converte para UTC
  const fromDate = dayjs
    .tz(`${from} 00:00:00`, "America/Sao_Paulo")
    .utc()
    .toDate();
  const toDate = dayjs.tz(`${to} 23:59:59`, "America/Sao_Paulo").utc().toDate();

  // Condições SQL centralizadas com forçamento de UTC
  const conveniosCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.activeAt} AT TIME ZONE 'UTC' >= ${fromDate} AND ${patientsTable.activeAt} AT TIME ZONE 'UTC' <= ${toDate} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`.mapWith(
      Number,
    );
  const conveniosRenovadosCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' >= ${fromDate} AND ${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' <= ${toDate} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`.mapWith(
      Number,
    );
  const totalCondition =
    sql<number>`${conveniosCondition} + ${conveniosRenovadosCondition}`.mapWith(
      Number,
    );

  const enterpriseCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.cardType} = 'enterprise' AND ${patientsTable.isActive} = true AND ${patientsTable.activeAt} AT TIME ZONE 'UTC' >= ${fromDate} AND ${patientsTable.activeAt} AT TIME ZONE 'UTC' <= ${toDate} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`.mapWith(
      Number,
    );
  const enterpriseRenovadosCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.cardType} = 'enterprise' AND ${patientsTable.isActive} = true AND ${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' >= ${fromDate} AND ${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' <= ${toDate} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`.mapWith(
      Number,
    );
  const enterpriseTotalCondition =
    sql<number>`${enterpriseCondition} + ${enterpriseRenovadosCondition}`.mapWith(
      Number,
    );

  const sellersWithPatientsCount = await db
    .select({
      id: sellersTable.id,
      name: sellersTable.name,
      avatarImageUrl: sellersTable.avatarImageUrl,
      cpfNumber: sellersTable.cpfNumber,
      phoneNumber: sellersTable.phoneNumber,
      email: sellersTable.email,
      clinicId: sellersTable.clinicId,
      clinicName: clinicsTable.name,
      patientsCount: totalCondition,
      enterpriseCount: enterpriseTotalCondition,
      percentage: sellersTable.percentage,
      pixKey: sellersTable.pixKey,
      pixKeyType: sellersTable.pixKeyType,
    })
    .from(sellersTable)
    .innerJoin(clinicsTable, eq(sellersTable.clinicId, clinicsTable.id))
    .leftJoin(
      patientsTable,
      and(
        eq(sellersTable.id, patientsTable.sellerId),
        eq(patientsTable.isActive, true),
      ),
    )
    .where(whereCondition)
    .groupBy(sellersTable.id, clinicsTable.name)
    .orderBy(sql`${totalCondition} DESC`);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Vendedores da Unidade</PageTitle>
          <PageDescription>
            Gerencie os vendedores da unidade {gestor.clinic.name}
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
          <AddSellerButton clinicId={gestor.clinicId} />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<div>Carregando...</div>}>
            <SearchSellers />
          </Suspense>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sellersWithPatientsCount.length > 0 ? (
            sellersWithPatientsCount.map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))
          ) : (
            <div className="col-span-full py-8 text-center">
              <p className="text-gray-500">
                {searchTerm
                  ? `Nenhum vendedor encontrado para "${searchTerm}"`
                  : "Nenhum vendedor cadastrado nesta unidade"}
              </p>
            </div>
          )}
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const SellersGestorPageWrapper = (props: SellersGestorPageProps) => {
  return (
    <Suspense fallback={<div>Carregando vendedores...</div>}>
      <SellersGestorPage {...props} />
    </Suspense>
  );
};

export default SellersGestorPageWrapper;
