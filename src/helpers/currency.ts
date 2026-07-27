export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Preços por operação × tipo de cartão, em centavos.
 * Definido aqui (e não em src/data) para poder ser usado também por
 * componentes de cliente, sem arrastar o acesso ao banco para o bundle.
 */
export interface CardPrices {
  activation: {
    personal: number;
    enterprise: number;
  };
  renewal: {
    personal: number;
    enterprise: number;
  };
}

/**
 * Quantidade de convênios separada nas 4 combinações que geram faturamento.
 */
export interface ConveniosBreakdown {
  novosIndividual: number;
  novosEmpresa: number;
  renovadosIndividual: number;
  renovadosEmpresa: number;
}

/**
 * Calcula o faturamento aplicando o preço cadastrado de cada combinação.
 * Recebe preços em centavos e retorna em reais, unidade usada pelo restante
 * do sistema (ticket médio, comissões, metas e gráficos).
 */
export const calcularFaturamento = (
  convenios: ConveniosBreakdown,
  prices: CardPrices,
): number => {
  const totalInCents =
    convenios.novosIndividual * prices.activation.personal +
    convenios.novosEmpresa * prices.activation.enterprise +
    convenios.renovadosIndividual * prices.renewal.personal +
    convenios.renovadosEmpresa * prices.renewal.enterprise;

  return totalInCents / 100;
};

/**
 * Monta o breakdown a partir dos totais que as consultas já produzem:
 * total de novos, novos empresariais, total de renovados e renovados empresariais.
 */
export const buildConveniosBreakdown = ({
  novos,
  novosEmpresa,
  renovados,
  renovadosEmpresa,
}: {
  novos: number;
  novosEmpresa: number;
  renovados: number;
  renovadosEmpresa: number;
}): ConveniosBreakdown => ({
  novosIndividual: novos - novosEmpresa,
  novosEmpresa,
  renovadosIndividual: renovados - renovadosEmpresa,
  renovadosEmpresa,
});
