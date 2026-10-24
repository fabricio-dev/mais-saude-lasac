/**
 * Confirmação de ativação/renovação do convênio por WhatsApp, com a lista de
 * parceiros em PDF: no cabeçalho do próprio modelo (padrão), ou numa segunda
 * mensagem quando o modelo escolhido para a confirmação não tem documento.
 *
 * Usada pelo cadastro e pela troca de telefone (upsert-patient) e pela ativação
 * (activate-patient), que mandam a mesma dupla de mensagens.
 */

import { PARTNERS_LIST_PATH } from "@/data/partners-list-file";
import { getMessageTemplates } from "@/data/whatsapp-message-templates";
import { getWhatsAppSettings } from "@/data/whatsapp-settings";

import { sendWhatsAppTemplate } from "./client";
import { buildExternalId } from "./external-id";
import { buildTemplateParameters } from "./message-templates";

export type ConfirmationType =
  | "activation"
  | "renewal"
  | "early_renewal"
  | "phone_updated";

const CATEGORY: Record<ConfirmationType, string> = {
  activation: "Convênio ativado",
  renewal: "Convênio renovado",
  early_renewal: "Renovação antecipada",
  phone_updated: "Telefone atualizado",
};

interface PatientConfirmationParams {
  patientId: string;
  patientName: string;
  phoneNumber: string;
  type: ConfirmationType;
  expirationDate: Date;
  clinicName?: string;
}

export async function sendPatientConfirmation({
  patientId,
  patientName,
  phoneNumber,
  type,
  expirationDate,
  clinicName,
}: PatientConfirmationParams): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://maissaudelasac.com.br";

  try {
    // Os modelos escolhidos em /whatsapp para a confirmação e para a lista.
    const [templates, settings] = await Promise.all([
      getMessageTemplates(),
      getWhatsAppSettings(),
    ]);
    const context = {
      patientName,
      expirationDate,
      clinicName,
      officialNumber: settings.officialNumber,
    };
    const confirmation = templates[type];
    const partners = templates.partners_list;

    const partnersPdf = {
      link: `${appUrl}${PARTNERS_LIST_PATH}`,
      filename: "Lista de Parceiros - Mais Saúde.pdf",
    };

    // Modelo da confirmação com documento no cabeçalho: o PDF vai nela, e é
    // uma mensagem só. Sem documento, a lista sai logo depois, separada.
    await sendWhatsAppTemplate({
      externalId: buildExternalId(type, patientId, expirationDate, phoneNumber),
      phoneNumber,
      patientName,
      category: CATEGORY[type],
      templateName: confirmation.templateName,
      language: confirmation.templateLanguage,
      parameters: buildTemplateParameters(confirmation.params, context),
      ...(confirmation.headerDocument ? { document: partnersPdf } : {}),
    });
    if (confirmation.headerDocument) return;

    // Em sequência, e não em paralelo: a confirmação precisa chegar antes do
    // PDF, e a ordem dos pedidos é a ordem da fila no whatsapp-ai.
    await sendWhatsAppTemplate({
      externalId: buildExternalId(
        "lista_de_parceiros",
        patientId,
        expirationDate,
        phoneNumber,
      ),
      phoneNumber,
      patientName,
      category: "Lista de parceiros",
      templateName: partners.templateName,
      language: partners.templateLanguage,
      parameters: buildTemplateParameters(partners.params, context),
      ...(partners.headerDocument ? { document: partnersPdf } : {}),
    });
  } catch (error) {
    // O WhatsApp é aviso: falhar aqui não pode desfazer a ativação.
    console.error(
      `Erro ao enviar confirmação por WhatsApp para paciente ${patientId}:`,
      error,
    );
  }
}
