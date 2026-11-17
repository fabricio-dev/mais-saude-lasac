import { type SQL, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * O CPF da coluna, sem pontuação, igual ao que o paciente mandou.
 *
 * A coluna guarda dos dois jeitos: 2.546 cadastros com só os dígitos e 329 com
 * "000.000.000-00" (backup de 21/10/2026). A consulta comparava os dígitos com
 * a coluna como está, e os 329 nunca eram achados — o paciente mandava o CPF
 * certo e ouvia "não encontrei" (whatsapp-ai, conversa #10 da análise de 11/11).
 * A comparação tira a pontuação dos dois lados; quem chama já manda só os
 * dígitos.
 */
export function cpfDoCadastroIgual(coluna: AnyPgColumn, cpf: string): SQL {
  return sql`regexp_replace(${coluna}, '[^0-9]', '', 'g') = ${cpf}`;
}
