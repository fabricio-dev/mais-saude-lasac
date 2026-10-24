export type NucleoTelefone = { ddd: string; final: string };

/**
 * DDD + os 8 dígitos finais — o que sobrevive ao "55" e ao nono dígito.
 *
 * O formulário já grava só dígitos, sem código de país, e a única variação é o
 * nono (87991372728 ou 8791372728). Do WhatsApp o número chega com o 55 e
 * também com ou sem o nono, então são quatro combinações que precisam apontar
 * para a mesma pessoa. O que não muda em nenhuma delas é o DDD e os 8 finais.
 *
 * A limpeza de não-dígitos é guarda para linha antiga, anterior à normalização:
 * uma máscara gravada no passado casa igual, em vez de falhar calada.
 */
export function nucleoTelefone(bruto: string): NucleoTelefone | null {
  let digitos = bruto.replace(/\D/g, "");

  if (digitos.length > 11 && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }

  if (digitos.length < 10) return null;

  return { ddd: digitos.slice(0, 2), final: digitos.slice(-8) };
}

export const mesmoTelefone = (a: NucleoTelefone, b: NucleoTelefone | null) =>
  b !== null && a.ddd === b.ddd && a.final === b.final;

/** Se o número é outro — máscara, 55 ou nono dígito não contam como troca. */
export function telefoneMudou(antes: string, depois: string): boolean {
  const novo = nucleoTelefone(depois);
  return !novo || !mesmoTelefone(novo, nucleoTelefone(antes));
}
