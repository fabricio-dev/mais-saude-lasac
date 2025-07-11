import { and, eq, ilike, or } from "drizzle-orm";
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
import { sellersTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddSellerButton from "./_components/add-seller-button";
import SearchSellers from "./_components/search-sellers";
import SellerCard from "./_components/seller-card";

interface SellersPageProps {
  searchParams: {
    search?: string;
  };
}

const SellersPage = async ({ searchParams }: SellersPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  //user.admim para usuarios administradores ou nao para vendedores
  //const isAdmin = session?.user.admin;\
  //if (!isAdmin) {
  //  redirect("/authentication");
  //}
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session?.user.clinic) {
    redirect("/clinics");
  }

  // Construir as condições de busca
  const searchTerm = searchParams.search?.trim();

  let whereCondition = eq(sellersTable.clinicId, session.user.clinic.id);

  if (searchTerm) {
    const searchConditions = or(
      ilike(sellersTable.name, `%${searchTerm}%`),
      ilike(sellersTable.cpfNumber, `%${searchTerm}%`),
      ilike(sellersTable.email, `%${searchTerm}%`),
      ilike(sellersTable.phoneNumber, `%${searchTerm}%`),
    );

    whereCondition = and(
      eq(sellersTable.clinicId, session.user.clinic.id),
      searchConditions,
    ) as typeof whereCondition;
  }

  const sellers = await db.query.sellersTable.findMany({
    where: whereCondition,
  });
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Vendedores</PageTitle>
          <PageDescription>
            Gerencie os vendedores de suas clínicas
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddSellerButton />
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<div>Carre...</div>}>
            <SearchSellers />
          </Suspense>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sellers.length > 0 ? (
            sellers.map((seller) => (
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
