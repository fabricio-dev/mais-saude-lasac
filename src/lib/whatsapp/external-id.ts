import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { nucleoTelefone } from "@/helpers/phone-core";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Id de um envio no whatsapp-ai — o mesmo valor nunca envia duas vezes.
 *
 * A validade entra no id: depois de uma renovação, o próximo ciclo é outro
 * envio, e repetir no mesmo ciclo (duplo clique, cron duas vezes) não manda
 * duas vezes. O telefone também: quando o cadastro troca de número, os
 * lembretes zerados e o aviso de telefone atualizado precisam sair de novo.
 * Entra o núcleo (DDD + 8 finais), para o nono dígito não contar como troca.
 */
export function buildExternalId(
  kind: string,
  patientId: string,
  expirationDate: Date,
  phoneNumber: string,
): string {
  const ciclo = dayjs(expirationDate)
    .tz("America/Sao_Paulo")
    .format("YYYY-MM-DD");
  const nucleo = nucleoTelefone(phoneNumber);
  const telefone = nucleo
    ? `${nucleo.ddd}${nucleo.final}`
    : phoneNumber.replace(/\D/g, "");

  return `${kind}:${patientId}:${ciclo}:${telefone}`;
}
