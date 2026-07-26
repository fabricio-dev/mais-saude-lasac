export type Operation = "activation" | "renewal";
export type CardType = "personal" | "enterprise";

export const operationLabels: Record<Operation, string> = {
  activation: "Ativação",
  renewal: "Renovação",
};

export const cardTypeLabels: Record<CardType, string> = {
  personal: "INDIVIDUAL",
  enterprise: "EMPRESA",
};

export const formatCurrency = (cents: number) => {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};
