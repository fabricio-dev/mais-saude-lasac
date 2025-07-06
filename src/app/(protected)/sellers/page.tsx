import { eq } from "drizzle-orm";
import { SearchIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import SellerCard from "./_components/seller-card";

const SellersPage = async () => {
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
    redirect("/clinic-form");
  }
  const sellers = await db.query.sellersTable.findMany({
    where: eq(sellersTable.clinicId, session.user.clinic.id),
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
          <div className="flex gap-2">
            <Input type="text" placeholder="Pesquisar" />
            <Button variant="outline">
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
};
export default SellersPage;
