import dayjs from "dayjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PageContainer, PageContent } from "@/components/ui/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getManagement } from "@/data/get-management";
import { getVendedores } from "@/data/get-vendedores";
import { auth } from "@/lib/auth";

import RelatorioUnidades from "./_components/relatorio-unidades";
import RelatorioVendedores from "./_components/relatorio-vendedores";

interface ManagementPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
    clinicId?: string;
    vendedorId?: string;
    tab?: string;
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
  const { from, to, clinicId, vendedorId, tab } = params;

  if (!from || !to) {
    redirect(
      `/management?from=${dayjs().subtract(1, "month").add(1, "day").format("YYYY-MM-DD")}&to=${dayjs().add(1, "day").format("YYYY-MM-DD")}`,
    );
  }

  // Buscar dados de management (unidades)
  const managementData = await getManagement({
    from,
    to,
    clinicId: clinicId || "all",
    session,
  });

  // Buscar dados de vendedores - usar a clínica do usuário se não especificada
  const vendedoresData = await getVendedores({
    from,
    to,
    clinicId: clinicId || session.user.clinic.id,
    vendedorId: vendedorId || "all",
    session,
  });

  return (
    <PageContainer>
      <PageContent>
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-6">
            <Tabs defaultValue={tab || "unidades"} className="w-full">
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
                <RelatorioVendedores
                  searchParams={params}
                  initialData={vendedoresData}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Componente de Loading
const ManagementLoading = () => {
  return (
    <PageContainer>
      <PageContent>
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-6">
            {/* Tabs Loading */}
            <div className="w-full">
              <div className="grid h-10 w-full grid-cols-2 rounded-md bg-gray-100">
                <div className="m-1 h-8 w-32 animate-pulse rounded bg-gray-200" />
                <div className="m-1 h-8 w-32 animate-pulse rounded bg-gray-200" />
              </div>

              {/* Tab Content Loading */}
              <div className="mt-6 w-full space-y-6">
                {/* Header com filtros */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>

                {/* Stats Cards Loading */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border p-6">
                      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
                        <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart Loading */}
                <div className="bg-card rounded-lg border">
                  <div className="p-6">
                    <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="h-64 w-full animate-pulse rounded bg-gray-200" />
                  </div>
                </div>

                {/* Table Loading */}
                <div className="bg-card rounded-lg border">
                  <div className="p-6">
                    <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="space-y-3">
                      {/* Table Header */}
                      <div className="flex space-x-4 border-b pb-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </div>
                      {/* Table Rows */}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex space-x-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                          <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const ManagementPageWrapper = (props: ManagementPageProps) => {
  return (
    <Suspense fallback={<ManagementLoading />}>
      <ManagementPage {...props} />
    </Suspense>
  );
};

export default ManagementPageWrapper;
