/**
 * Confirmação de ativação/renovação do convênio por WhatsApp: o template de
 * confirmação e, em seguida, a lista de parceiros em PDF.
 *
 * Usada pelo cadastro (upsert-patient) e pela ativação (activate-patient), que
 * mandam a mesma dupla de mensagens.
 */

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { PARTNERS_LIST_PATH } from "@/data/partners-list-file";
import { getMessageTemplates } from "@/data/whatsapp-message-templates";
import { getWhatsAppSettings } from "@/data/whatsapp-settings";

import { sendWhatsAppTemplate } from "./client";
import { buildTemplateParameters } from "./message-templates";

dayjs.extend(utc);
dayjs.extend(timezone);

export type ConfirmationType = "activation" | "renewal" | "early_renewal";

const CATEGORY: Record<ConfirmationType, string> = {
  activation: "Convênio ativado",
  renewal: "Convênio renovado",
  early_renewal: "Renovação antecipada",
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
  // A nova validade entra no id: cada ciclo de renovação é um envio novo, e
  // repetir a mesma ativação (duplo clique, retry) não manda duas vezes.
  const ciclo = dayjs(expirationDate)
    .tz("America/Sao_Paulo")
    .format("YYYY-MM-DD");

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

    // Em sequência, e não em paralelo: a confirmação precisa chegar antes do
    // PDF, e a ordem dos pedidos é a ordem da fila no whatsapp-ai.
    await sendWhatsAppTemplate({
      externalId: `${type}:${patientId}:${ciclo}`,
      phoneNumber,
      patientName,
      category: CATEGORY[type],
      templateName: confirmation.templateName,
      language: confirmation.templateLanguage,
      parameters: buildTemplateParameters(confirmation.params, context),
    });

    await sendWhatsAppTemplate({
      externalId: `lista_de_parceiros:${patientId}:${ciclo}`,
      phoneNumber,
      patientName,
      category: "Lista de parceiros",
      templateName: partners.templateName,
      language: partners.templateLanguage,
      parameters: buildTemplateParameters(partners.params, context),
      ...(partners.headerDocument
        ? {
            document: {
              link: `${appUrl}${PARTNERS_LIST_PATH}`,
              filename: "Lista de Parceiros - Mais Saúde.pdf",
            },
          }
        : {}),
    });
  } catch (error) {
    // O WhatsApp é aviso: falhar aqui não pode desfazer a ativação.
    console.error(
      `Erro ao enviar confirmação por WhatsApp para paciente ${patientId}:`,
      error,
    );
  }
}
