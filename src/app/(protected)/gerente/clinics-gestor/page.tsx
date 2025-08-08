import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  // PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

const ClinicsGestorPage = async () => {
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

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Unidades</PageTitle>
          <PageDescription>Gerencie as unidades do seu sistema</PageDescription>
        </PageHeaderContent>
        {/* <PageActions>
          <UpdateClinicForm />
        </PageActions> */}
      </PageHeader>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<div>Carregando...</div>}></Suspense>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full py-8 text-center">
            <p className="text-gray-500">Nenhuma unidade cadastrada</p>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};

// Wrapper para suporte ao Suspense com searchParams
const ClinicsGestorPageWrapper = () => {
  return (
    <Suspense fallback={<div>Carregando dados...</div>}>
      <ClinicsGestorPage />
    </Suspense>
  );
};

export default ClinicsGestorPageWrapper;
