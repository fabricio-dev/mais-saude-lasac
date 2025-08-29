import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PageContainer } from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

import { AdminContent } from "./_components/admin-content";

const AdminPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (session.user.role !== "admin") {
    redirect("/vendedor/dashboard-seller");
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, roles e configurações do sistema
          </p>
        </div>

        <AdminContent />
      </div>
    </PageContainer>
  );
};

// Componente de Loading
const AdminLoading = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <div className="mb-2 h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Tabs Loading */}
        <div className="space-y-6">
          <div className="grid h-10 w-full grid-cols-3 rounded-md bg-gray-100">
            <div className="m-1 h-8 w-32 animate-pulse rounded bg-gray-200" />
            <div className="m-1 h-8 w-32 animate-pulse rounded bg-gray-200" />
            <div className="m-1 h-8 w-32 animate-pulse rounded bg-gray-200" />
          </div>

          {/* Content Loading */}
          <div className="space-y-6">
            {/* Search and Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
              <div className="flex gap-2">
                <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
              </div>
            </div>

            {/* Table Loading */}
            <div className="bg-card rounded-lg border">
              <div className="p-6">
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="flex space-x-4 border-b pb-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  </div>
                  {/* Table Rows */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
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
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense
const AdminPageWrapper = () => {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminPage />
    </Suspense>
  );
};

export default AdminPageWrapper;
