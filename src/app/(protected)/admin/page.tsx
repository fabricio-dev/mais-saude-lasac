import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
    redirect("/dashboard-seller");
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

export default AdminPage;
