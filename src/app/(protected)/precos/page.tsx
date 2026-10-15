
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { requireRole } from "@/lib/require-role";

import CardPricesTable from "./_components/card-prices-table";

const PrecosPage = async () => {
  await requireRole("admin");

  const cardPrices = await db.query.cardPricesTable.findMany({
    orderBy: (cardPrices, { asc }) => [
      asc(cardPrices.operation),
      asc(cardPrices.cardType),
    ],
  });

  const priceHistory = await db.query.cardPriceHistoryTable.findMany({
    orderBy: (history, { desc }) => [desc(history.createdAt)],
    with: {
      changedBy: {
        columns: {
          name: true,
        },
      },
    },
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Preços</PageTitle>
          <PageDescription>
            Gerencie os valores cobrados por ativação e renovação de cada tipo
            de cartão.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <CardPricesTable cardPrices={cardPrices} priceHistory={priceHistory} />
      </PageContent>
    </PageContainer>
  );
};

export default PrecosPage;
