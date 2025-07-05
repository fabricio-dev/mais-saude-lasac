import { Plus } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

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

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Vendedores</PageTitle>
          <PageDescription>
            Gerencie os vendedores da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <Button>
            <Plus />
            Novo Vendedor
          </Button>
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Lista de Vendedores</h2>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Lista de Vendedores</h2>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};
export default SellersPage;
