/**
 * Templates de mensagens WhatsApp para ativação e renovação de pacientes
 */

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
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
 * Retorna fallback se data for inválida
 */
function formatExpirationDate(date: Date | null | undefined): string {
  if (!date) {
    return "Data não informada";
  }

  const formatted = dayjs(date).tz("America/Sao_Paulo").format("DD/MM/YYYY");

  // Verificar se a data é válida
  if (!dayjs(date).isValid()) {
    return "Data não informada";
  }

  return formatted;
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

  return `Olá ${firstName}.

Seu convênio Mais Saúde foi ativado com sucesso.

Validade até: ${formattedDate}

Unidade: ${clinicName || "Mais Saúde"}

Qualquer dúvida, estamos à disposição.`;
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

  return `Olá ${firstName}.

Seu convênio Mais Saúde foi renovado com sucesso.

*Nova validade até:* ${formattedDate}

*Unidade:* ${clinicName || "Mais Saúde"}

Esta é uma confirmação automática do sistema.`;
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

  return `Olá ${firstName}.

Seu convênio Mais Saúde foi renovado antecipadamente.

*Nova validade até:* ${formattedDate}

*Unidade:* ${clinicName || "Mais Saúde"}

Obrigado pela renovação antecipada! Seu tempo adicional foi preservado.

Esta é uma confirmação automática do sistema.`;
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

/**
 * Estrutura para usar templates aprovados do WhatsApp Business API
 */
interface TemplateConfig {
  name: string;
  parameters: string[];
}

/**
 * Retorna configuração do template para WhatsApp Business API
 * Templates devem estar pré-aprovados no Meta Business Manager
 */
export function getTemplateConfig(
  type: "activation" | "renewal" | "early_renewal",
  params: MessageTemplateParams,
): TemplateConfig {
  const formattedDate = formatExpirationDate(params.expirationDate);
  const firstName = params.patientName.split(" ")[0]?.trim() || "Cliente";
  const clinicName = params.clinicName?.trim() || "Mais Saúde";

  switch (type) {
    case "activation":
      return {
        name: "convenio_ativado",
        parameters: [firstName, formattedDate, clinicName],
      };

    case "early_renewal":
      return {
        name: "convenio_renovado_antecipado",
        parameters: [firstName, formattedDate, clinicName],
      };

    case "renewal":
      return {
        name: "convenio_renovado",
        parameters: [firstName, formattedDate, clinicName],
      };

    default:
      return {
        name: "convenio_renovado",
        parameters: [firstName, formattedDate, clinicName],
      };
  }
}
