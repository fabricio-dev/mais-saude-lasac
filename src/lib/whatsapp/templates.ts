/**
 * Templates de mensagens WhatsApp para ativação e renovação de pacientes
 */

import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Configurar dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("pt-br");

interface MessageTemplateParams {
  patientName: string;
  expirationDate: Date;
  clinicName?: string;
}

/**
 * Formata a data de expiração no formato brasileiro
 */
function formatExpirationDate(date: Date): string {
  return dayjs(date)
    .tz("America/Sao_Paulo")
    .format("DD/MM/YYYY");
}

/**
 * Template para primeira ativação do convênio
 */
export function getActivationMessageTemplate({
  patientName,
  expirationDate,
  clinicName,
}: MessageTemplateParams): string {
  const formattedDate = formatExpirationDate(expirationDate);
  const firstName = patientName.split(" ")[0];

  return `🎉 Olá ${firstName}!

Seu convênio Mais Saúde foi ativado com sucesso! ✅

📅 *Validade até:* ${formattedDate}${clinicName ? `\n🏥 *Unidade:* ${clinicName}` : ""}

Bem-vindo(a) à família Mais Saúde! Agora você tem acesso a uma rede completa de serviços de saúde.

Qualquer dúvida, estamos à disposição! 💚`;
}

/**
 * Template para renovação do convênio
 */
export function getRenewalMessageTemplate({
  patientName,
  expirationDate,
  clinicName,
}: MessageTemplateParams): string {
  const formattedDate = formatExpirationDate(expirationDate);
  const firstName = patientName.split(" ")[0];

  return `✅ Olá ${firstName}!

Seu convênio Mais Saúde foi renovado! 🔄

📅 *Nova validade até:* ${formattedDate}${clinicName ? `\n🏥 *Unidade:* ${clinicName}` : ""}

Obrigado por continuar conosco! Sua saúde é nossa prioridade.

Qualquer dúvida, estamos à disposição! 💚`;
}

/**
 * Template para renovação antecipada (quando renova antes de vencer)
 */
export function getEarlyRenewalMessageTemplate({
  patientName,
  expirationDate,
  clinicName,
}: MessageTemplateParams): string {
  const formattedDate = formatExpirationDate(expirationDate);
  const firstName = patientName.split(" ")[0];

  return `✅ Olá ${firstName}!

Seu convênio Mais Saúde foi renovado antecipadamente! 🔄⚡

📅 *Nova validade até:* ${formattedDate}${clinicName ? `\n🏥 *Unidade:* ${clinicName}` : ""}

Obrigado pela renovação antecipada! Seu tempo adicional foi preservado.

Qualquer dúvida, estamos à disposição! 💚`;
}

/**
 * Escolhe o template apropriado baseado no tipo de ativação
 */
export function getMessageTemplate(
  type: "activation" | "renewal" | "early_renewal",
  params: MessageTemplateParams,
): string {
  switch (type) {
    case "activation":
      return getActivationMessageTemplate(params);
    case "early_renewal":
      return getEarlyRenewalMessageTemplate(params);
    case "renewal":
      return getRenewalMessageTemplate(params);
    default:
      return getRenewalMessageTemplate(params);
  }
}

