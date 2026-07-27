import { db } from "@/db";
import { CardPrices } from "@/helpers/currency";

// Valores usados antes da tabela de preços existir.
// Servem de fallback caso alguma combinação não esteja cadastrada,
// garantindo que nenhum relatório quebre ou zere por falta de configuração.
const LEGACY_PERSONAL_IN_CENTS = 10000; // R$ 100,00
const LEGACY_ENTERPRISE_IN_CENTS = 9000; // R$ 90,00

/**
 * Busca os preços cadastrados por operação × tipo de cartão.
 * Valores retornados em centavos.
 */
export const getCardPrices = async (): Promise<CardPrices> => {
  const prices = await db.query.cardPricesTable.findMany();

  const findPrice = (
    operation: "activation" | "renewal",
    cardType: "personal" | "enterprise",
    fallback: number,
  ) =>
    prices.find(
      (price) => price.operation === operation && price.cardType === cardType,
    )?.amountInCents ?? fallback;

  return {
    activation: {
      personal: findPrice("activation", "personal", LEGACY_PERSONAL_IN_CENTS),
      enterprise: findPrice(
        "activation",
        "enterprise",
        LEGACY_ENTERPRISE_IN_CENTS,
      ),
    },
    renewal: {
      personal: findPrice("renewal", "personal", LEGACY_PERSONAL_IN_CENTS),
      enterprise: findPrice("renewal", "enterprise", LEGACY_ENTERPRISE_IN_CENTS),
    },
  };
};
