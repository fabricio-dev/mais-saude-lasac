import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

const sellerCoveniosPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (session.user.role !== "user") {
    redirect("/dashboard");
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Convênios</h1>
          <p className="text-muted-foreground">Gerencie os convênios</p>
        </div>
      </div>
    </PageContainer>
  );
};

export default sellerCoveniosPage;
