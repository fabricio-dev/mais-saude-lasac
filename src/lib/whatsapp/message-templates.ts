/**
 * Qual modelo aprovado vai em cada mensagem, e de onde vem cada variável.
 *
 * Módulo puro (sem banco): a tela /whatsapp usa no navegador para a prévia, e
 * o envio usa no servidor para montar os parâmetros. O que fica gravado está
 * em src/data/whatsapp-message-templates.ts.
 */

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { formatPhoneNumber } from "./utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export const MESSAGE_KEYS = [
  "activation",
  "renewal",
  "early_renewal",
  "partners_list",
  "reminder_d7",
  "reminder_d0",
  "reminder_d0_late",
  "reminder_d30",
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

export const MESSAGE_LABELS: Record<
  MessageKey,
  { title: string; description: string }
> = {
  activation: {
    title: "Convênio ativado",
    description: "No cadastro ou na primeira ativação.",
  },
  renewal: {
    title: "Convênio renovado",
    description: "Renovação de um convênio já vencido.",
  },
  early_renewal: {
    title: "Renovação antecipada",
    description: "Renovação antes de vencer.",
  },
  partners_list: {
    title: "Lista de parceiros",
    description:
      "Logo depois de cada confirmação acima. O modelo precisa ter cabeçalho de documento: é ali que vai o PDF.",
  },
  reminder_d7: {
    title: "7 dias antes do vencimento",
    description: "Lembrete de quem vence nos próximos 7 dias.",
  },
  reminder_d0: {
    title: "No dia do vencimento",
    description: "Lembrete no próprio dia.",
  },
  reminder_d0_late: {
    title: "Vencido sem aviso no dia",
    description: "Para quem não recebeu o aviso do dia (até 29 dias depois).",
  },
  reminder_d30: {
    title: "30 dias ou mais vencido",
    description: "Lembrete de quem venceu há 30 dias ou mais.",
  },
};

export const VARIABLE_SOURCES = [
  "first_name",
  "full_name",
  "expiration_date",
  "clinic_name",
  "contact_number",
  "fixed_text",
] as const;

export type VariableSource = (typeof VARIABLE_SOURCES)[number];

export const VARIABLE_SOURCE_LABELS: Record<VariableSource, string> = {
  first_name: "Primeiro nome do paciente",
  full_name: "Nome completo do paciente",
  expiration_date: "Data de vencimento (DD/MM/AAAA)",
  clinic_name: "Nome da clínica",
  contact_number: "Número de contato (tela WhatsApp)",
  fixed_text: "Texto fixo",
};

export type TemplateParam = { source: VariableSource; text?: string };

export type MessageTemplateConfig = {
  templateName: string;
  templateLanguage: string;
  params: TemplateParam[];
  /** O modelo tem cabeçalho de documento: o PDF de parceiros vai nele. */
  headerDocument: boolean;
};

const p = (...sources: VariableSource[]): TemplateParam[] =>
  sources.map((source) => ({ source }));

/**
 * O que vale enquanto ninguém escolheu pela tela: exatamente o que o sistema
 * enviava antes de a escolha existir.
 */
export const DEFAULT_MESSAGE_TEMPLATES: Record<
  MessageKey,
  MessageTemplateConfig
> = {
  activation: {
    templateName: "convenio_ativado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "clinic_name"),
    headerDocument: false,
  },
  renewal: {
    templateName: "convenio_renovado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "clinic_name"),
    headerDocument: false,
  },
  early_renewal: {
    templateName: "convenio_renovado_antecipado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "clinic_name"),
    headerDocument: false,
  },
  partners_list: {
    templateName: "lista_de_parceiros",
    templateLanguage: "pt_BR",
    params: [],
    headerDocument: true,
  },
  reminder_d7: {
    templateName: "lembrete_vencimento_7_dias",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "contact_number"),
    headerDocument: false,
  },
  reminder_d0: {
    templateName: "lembrete_vencimento_hoje",
    templateLanguage: "pt_BR",
    params: p("first_name", "contact_number"),
    headerDocument: false,
  },
  reminder_d0_late: {
    templateName: "lembrete_vencimento_atrasado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "contact_number"),
    headerDocument: false,
  },
  reminder_d30: {
    templateName: "lembrete_vencimento_30_dias",
    templateLanguage: "pt_BR",
    params: p("first_name", "contact_number"),
    headerDocument: false,
  },
};

export type MessageContext = {
  patientName: string;
  expirationDate: Date | null;
  clinicName?: string | null;
  officialNumber?: string | null;
};

/** O valor de cada variável para este paciente, na ordem do modelo. */
export function buildTemplateParameters(
  params: TemplateParam[],
  context: MessageContext,
): string[] {
  return params.map((param) => {
    switch (param.source) {
      case "first_name":
        return context.patientName.split(" ")[0]?.trim() || "Cliente";
      case "full_name":
        return context.patientName.trim() || "Cliente";
      case "expiration_date":
        return context.expirationDate && dayjs(context.expirationDate).isValid()
          ? dayjs(context.expirationDate)
              .tz("America/Sao_Paulo")
              .format("DD/MM/YYYY")
          : "Data não informada";
      case "clinic_name":
        return context.clinicName?.trim() || "Mais Saúde";
      case "contact_number":
        return formatPhoneNumber(
          context.officialNumber || process.env.WHATSAPP_OFFICIAL_NUMBER || "",
        );
      case "fixed_text":
        return param.text?.trim() ?? "";
    }
  });
}

/** Troca os {{n}} do corpo pelos valores — a prévia da tela. */
export function renderTemplateBody(body: string, values: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (match, index) => {
    const value = values[Number(index) - 1];
    return value === undefined || value === "" ? match : value;
  });
}

/** O arquivo que o cabeçalho do modelo pede, quando pede. */
export const mediaHeader = (template: { headerFormat: string | null }) =>
  template.headerFormat && template.headerFormat !== "TEXT"
    ? template.headerFormat
    : null;

/**
 * Por que este modelo não serve para esta mensagem, ou `null` se serve. A lista
 * de parceiros precisa de cabeçalho de documento (é nele que vai o PDF); as
 * outras mensagens não enviam arquivo.
 */
export function templateMismatch(
  key: MessageKey,
  template: { headerFormat: string | null; unsupported: string | null },
): string | null {
  if (template.unsupported) return template.unsupported;
  const media = mediaHeader(template);
  if (key === "partners_list" && media !== "DOCUMENT") {
    return "A lista de parceiros precisa de um modelo com cabeçalho de documento — é nele que vai o PDF.";
  }
  if (key !== "partners_list" && media) {
    return "Este modelo pede um arquivo no cabeçalho. Só a lista de parceiros envia arquivo.";
  }
  return null;
}
