import dayjs from "dayjs";
import {
  and,
  count,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
} from "drizzle-orm";
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
import { PercentageProvider } from "@/contexts/percentage-context";
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
import PercentageWrapper from "./_components/percentage-wrapper";
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
      `/sellers?from=${dayjs().subtract(1, "month").add(1, "day").format("YYYY-MM-DD")}&to=${dayjs().add(1, "day").format("YYYY-MM-DD")}`,
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

  // Buscar vendedores com contagem de pacientes ativos no período
  const sellersWithPatientsCount = await db
    .select({
      id: sellersTable.id,
      name: sellersTable.name,
      avatarImageUrl: sellersTable.avatarImageUrl,
      cpfNumber: sellersTable.cpfNumber,
      phoneNumber: sellersTable.phoneNumber,
      email: sellersTable.email,
      password: sellersTable.password,
      unity: sellersTable.unity,
      clinicId: sellersTable.clinicId,
      clinicName: clinicsTable.name,
      patientsCount: count(patientsTable.id),
    })
    .from(sellersTable)
    .innerJoin(clinicsTable, eq(sellersTable.clinicId, clinicsTable.id))
    .leftJoin(
      patientsTable,
      or(
        and(
          eq(sellersTable.id, patientsTable.sellerId),
          eq(patientsTable.isActive, true),
          isNull(patientsTable.reactivatedAt),
          gte(patientsTable.activeAt, new Date(from!)),
          lte(patientsTable.activeAt, new Date(to!)),
        ),
        and(
          eq(sellersTable.id, patientsTable.sellerId),
          eq(patientsTable.isActive, true),
          isNotNull(patientsTable.reactivatedAt),
          gte(patientsTable.reactivatedAt, new Date(from!)),
          lte(patientsTable.reactivatedAt, new Date(to!)),
        ),
      ),
    )
    .where(whereCondition)
    .groupBy(sellersTable.id, clinicsTable.name);

  return (
    <PercentageProvider>
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>Vendedores</PageTitle>
            <PageDescription>
              Gerencie os vendedores de suas clínicas
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <PercentageWrapper />
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
    </PercentageProvider>
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
