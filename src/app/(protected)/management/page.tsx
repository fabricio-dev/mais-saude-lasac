import dayjs from "dayjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer, PageContent } from "@/components/ui/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getManagement } from "@/data/get-management";
import { auth } from "@/lib/auth";

import RelatorioUnidades from "./_components/relatorio-unidades";
import RelatorioVendedores from "./_components/relatorio-vendedores";

interface ManagementPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
    clinicId?: string;
  }>;
}

const ManagementPage = async ({ searchParams }: ManagementPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  if (session.user.role !== "admin") {
    if (session.user.role === "gestor") {
      redirect("/gerente/dashboard-gestor");
    } else {
      redirect("/vendedor/dashboard-seller");
    }
  }

  if (!session?.user.clinic?.id) {
    redirect("/clinics");
  }
  const params = await searchParams;
  const { from, to, clinicId } = params;

  if (!from || !to) {
    redirect(
      `/management?from=${dayjs().subtract(1, "month").add(1, "day").format("YYYY-MM-DD")}&to=${dayjs().add(1, "day").format("YYYY-MM-DD")}`,
    );
  }

  // Buscar dados de management
  const managementData = await getManagement({
    from,
    to,
    clinicId: clinicId || "all",
    session,
  });

  return (
    <PageContainer>
      <PageContent>
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-6">
            <Tabs defaultValue="unidades" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unidades">
                  Relatório de Unidades
                </TabsTrigger>
                <TabsTrigger value="vendedores">
                  Relatório de Vendedores
                </TabsTrigger>
              </TabsList>
              <TabsContent value="unidades" className="mt-6 w-full">
                <RelatorioUnidades
                  searchParams={params}
                  initialData={managementData}
                />
              </TabsContent>
              <TabsContent value="vendedores" className="mt-6 w-full">
                <RelatorioVendedores />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default ManagementPage;
