import dayjs from "dayjs";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
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
import {
  clinicsTable,
  patientsTable,
  sellersTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import { DatePicker } from "../dashboard/_components/date-picker";
import AddSellerButton from "./_components/add-seller-button";
import SearchSellers from "./_components/search-sellers";
import SellerCard from "./_components/seller-card";
interface SellersPageProps {
  searchParams: Promise<{
    search?: string;
    from?: string;
    to?: string;
  }>;
}

const SellersPage = async ({ searchParams }: SellersPageProps) => {
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
  const { search, from, to } = await searchParams;

  if (!from || !to) {
    redirect(
      `/sellers?from=${dayjs().subtract(1, "month").format("YYYY-MM-DD")}&to=${dayjs().format("YYYY-MM-DD")}`,
    );
  }

  // Buscar todas as clínicas do usuário
  const userClinics = await db
    .select({ clinicId: usersToClinicsTable.clinicId })
    .from(usersToClinicsTable)
    .where(eq(usersToClinicsTable.userId, session.user.id));

  const clinicIds = userClinics.map((uc) => uc.clinicId);

  // Se o usuário não tem clínicas, redirecionar para criar uma
  if (clinicIds.length === 0) {
    redirect("/clinics");
  }
  const searchTerm = search?.trim();

  // Construir as condições de busca
  let whereCondition = inArray(sellersTable.clinicId, clinicIds);

  if (searchTerm) {
    const searchConditions = or(
      ilike(sellersTable.name, `%${searchTerm}%`),
      ilike(sellersTable.cpfNumber, `%${searchTerm}%`),
      ilike(sellersTable.email, `%${searchTerm}%`),
      ilike(sellersTable.phoneNumber, `%${searchTerm}%`),
    );

    whereCondition = and(
      inArray(sellersTable.clinicId, clinicIds),
      searchConditions,
    ) as typeof whereCondition;
  }

  // Definindo datas e condições SQL uma única vez - PRIORIZANDO SQL
  const fromDate = dayjs(from).startOf("day").toDate();
  const toDate = dayjs(to).endOf("day").toDate();

  // Condições SQL centralizadas (sem duplicidade)
  const conveniosCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.activeAt} >= ${fromDate} AND ${patientsTable.activeAt} <= ${toDate} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`.mapWith(
      Number,
    );
  const conveniosRenovadosCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.reactivatedAt} >= ${fromDate} AND ${patientsTable.reactivatedAt} <= ${toDate} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`.mapWith(
      Number,
    );
  const totalCondition =
    sql<number>`${conveniosCondition} + ${conveniosRenovadosCondition}`.mapWith(
      Number,
    );

  const enterpriseCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.cardType} = 'enterprise' AND ${patientsTable.isActive} = true AND ${patientsTable.activeAt} >= ${fromDate} AND ${patientsTable.activeAt} <= ${toDate} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`.mapWith(
      Number,
    );
  const enterpriseRenovadosCondition =
    sql<number>`COUNT(CASE WHEN ${patientsTable.cardType} = 'enterprise' AND ${patientsTable.isActive} = true AND ${patientsTable.reactivatedAt} >= ${fromDate} AND ${patientsTable.reactivatedAt} <= ${toDate} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`.mapWith(
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
    .groupBy(sellersTable.id, clinicsTable.name);

  return (
    console.log(from, to),
    (
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>Vendedores</PageTitle>
            <PageDescription>
              Gerencie os vendedores de suas unidades
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <DatePicker />
            <AddSellerButton />
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
                    : "Nenhum vendedor cadastrado"}
                </p>
              </div>
            )}
          </div>
        </PageContent>
      </PageContainer>
    )
  );
};
// Wrapper para suporte ao Suspense com searchParams

const SellersPageWrapper = (props: SellersPageProps) => {
  return (
    <Suspense fallback={<div>Carregando vendedores...</div>}>
      <SellersPage {...props} />
    </Suspense>
  );
};

export default SellersPageWrapper;
