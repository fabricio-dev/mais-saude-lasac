export const formatCurrencyInCents = (
  individual: number,
  enterprise: number,
) => {
  const a = (individual - enterprise) * 100; //subtrai os pacientes que sao de empresas e multiplica por 100

  const b = enterprise * 90; //multiplica os pacientes que sao de empresas por 90

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(a + b);
};
