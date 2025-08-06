import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

export default async function DashboardGestor() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (session.user.role !== "gestor") {
    redirect("/dashboard");
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard Gestor</PageTitle>
          <PageDescription>
            Bem-vindo ao painel de gestão. Gerencie suas unidades e vendedores.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <div className="grid gap-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-2 text-lg font-semibold">Área do Gestor</h2>
            <p className="text-muted-foreground">
              Aqui você pode gerenciar suas unidades, acompanhar o desempenho
              dos vendedores e visualizar relatórios específicos da sua região.
            </p>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
