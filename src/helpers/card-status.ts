import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Situação do cartão pelo **dia** da validade, não pela hora.
 *
 * A validade guarda a hora da ativação (agora + 1 ano). Comparada com o
 * instante, ela fazia o cartão "vencer" no meio do último dia — o mesmo dia em
 * que o lembrete diz "hoje é o último dia de validade", e a IA respondia
 * "seu cartão está vencido — validade 29/10/2026" em 29/10.
 *
 * `validUntil` é a data que a resposta mostra ("AAAA-MM-DD"). Comparar com ela
 * garante que a situação e a data nunca se contradizem; "hoje" é o de São
 * Paulo, onde estão o paciente e a unidade.
 */
export function situacaoDoCartao(
  validUntil: string | null,
  agora: Date = new Date(),
): "ativo" | "vencido" | null {
  if (!validUntil) return null;
  const hoje = dayjs(agora).tz("America/Sao_Paulo").format("YYYY-MM-DD");
  return validUntil >= hoje ? "ativo" : "vencido";
}
