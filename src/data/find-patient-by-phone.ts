import { and, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { mesmoTelefone, nucleoTelefone } from "@/helpers/phone-core";

/**
 * Paciente que já usa o telefone, comparando como a consulta de cartão:
 * DDD + 8 dígitos finais, para que o mesmo número com e sem o nono dígito
 * (87991372728 e 8791372728) conte como duplicado.
 *
 * O telefone placeholder "(00) 00000-0000" não é de ninguém e nunca bloqueia:
 * não existe DDD começando com 0.
 */
export async function findPatientByPhone(
  phoneNumber: string,
  excludePatientId?: string,
) {
  const telefone = nucleoTelefone(phoneNumber);
  if (!telefone || telefone.ddd.startsWith("0")) return null;

  const candidatos = await db
    .select({
      id: patientsTable.id,
      name: patientsTable.name,
      phoneNumber: patientsTable.phoneNumber,
    })
    .from(patientsTable)
    .where(
      and(
        sql`right(regexp_replace(${patientsTable.phoneNumber}, '[^0-9]', '', 'g'), 8) = ${telefone.final}`,
        excludePatientId ? ne(patientsTable.id, excludePatientId) : undefined,
      ),
    )
    .limit(50);

  return (
    candidatos.find((candidato) =>
      mesmoTelefone(telefone, nucleoTelefone(candidato.phoneNumber)),
    ) ?? null
  );
}
