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
  "phone_updated",
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
  phone_updated: {
    title: "Telefone atualizado",
    description:
      "Quando o número é corrigido até 7 dias depois da ativação ou renovação — a confirmação tinha ido para o número errado.",
  },
  partners_list: {
    title: "Lista de parceiros",
    description:
      "Só sai, logo depois da confirmação, quando o modelo da confirmação não leva o PDF no cabeçalho. Precisa de cabeçalho de documento.",
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
  /**
   * Lembretes: a mídia do cabeçalho do modelo, quando tem. Vai o arquivo
   * anexado em /whatsapp para a mensagem. As confirmações usam
   * `headerDocument`, com o PDF de parceiros.
   */
  headerMedia: HeaderMediaFormat | null;
};

const p = (...sources: VariableSource[]): TemplateParam[] =>
  sources.map((source) => ({ source }));

/**
 * O que vale enquanto ninguém escolheu pela tela: os modelos da conta da LASAC
 * (WABA "Mais Saúde LASAC", criada em outubro de 2026).
 *
 * - As confirmações levam o PDF de parceiros no cabeçalho: uma mensagem por
 *   confirmação em vez de duas. A `lista_de_parceiros` separada só sai quando
 *   o modelo escolhido para a confirmação não tem documento.
 * - Os lembretes não levam mais o número de contato (wa.me): saem do mesmo
 *   número do atendimento, e o paciente responde ali mesmo.
 */
export const DEFAULT_MESSAGE_TEMPLATES: Record<
  MessageKey,
  MessageTemplateConfig
> = {
  activation: {
    templateName: "convenio_ativado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "clinic_name"),
    headerDocument: true,
    headerMedia: null,
  },
  renewal: {
    templateName: "convenio_renovado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "clinic_name"),
    headerDocument: true,
    headerMedia: null,
  },
  early_renewal: {
    templateName: "convenio_renovado_antecipado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "clinic_name"),
    headerDocument: true,
    headerMedia: null,
  },
  phone_updated: {
    templateName: "telefone_atualizado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date", "clinic_name"),
    headerDocument: true,
    headerMedia: null,
  },
  partners_list: {
    templateName: "lista_de_parceiros",
    templateLanguage: "pt_BR",
    params: [],
    headerDocument: true,
    headerMedia: null,
  },
  reminder_d7: {
    templateName: "lembrete_vencimento_7_dias",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date"),
    headerDocument: false,
    headerMedia: null,
  },
  reminder_d0: {
    templateName: "lembrete_vencimento_hoje",
    templateLanguage: "pt_BR",
    params: p("first_name"),
    headerDocument: false,
    headerMedia: null,
  },
  reminder_d0_late: {
    templateName: "lembrete_vencimento_atrasado",
    templateLanguage: "pt_BR",
    params: p("first_name", "expiration_date"),
    headerDocument: false,
    headerMedia: null,
  },
  reminder_d30: {
    templateName: "lembrete_vencimento_30_dias",
    templateLanguage: "pt_BR",
    params: p("first_name"),
    headerDocument: false,
    headerMedia: null,
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

/** As mensagens que podem levar o PDF de parceiros no próprio cabeçalho. */
export const CONFIRMATION_KEYS: readonly MessageKey[] = [
  "activation",
  "renewal",
  "early_renewal",
  "phone_updated",
];

/** Os lembretes: levam no cabeçalho o arquivo anexado em /whatsapp. */
export const isReminderKey = (key: MessageKey) =>
  !CONFIRMATION_KEYS.includes(key) && key !== "partners_list";

const MB = 1024 * 1024;

/**
 * As mídias de cabeçalho que um lembrete pode levar, com os arquivos aceitos.
 * Limites da Meta, menos o do documento (100 MB lá): aqui o arquivo passa pelo
 * corpo da Server Action (next.config.ts).
 */
export const HEADER_MEDIA = {
  IMAGE: {
    label: "imagem",
    types: { "image/jpeg": "jpg", "image/png": "png" },
    maxBytes: 5 * MB,
    hint: "JPG ou PNG, até 5 MB",
  },
  DOCUMENT: {
    label: "documento",
    types: { "application/pdf": "pdf" },
    maxBytes: 10 * MB,
    hint: "PDF, até 10 MB",
  },
  VIDEO: {
    label: "vídeo",
    types: { "video/mp4": "mp4" },
    maxBytes: 16 * MB,
    hint: "MP4, até 16 MB",
  },
} as const;

export type HeaderMediaFormat = keyof typeof HEADER_MEDIA;

export type HeaderMediaType = {
  [F in HeaderMediaFormat]: keyof (typeof HEADER_MEDIA)[F]["types"];
}[HeaderMediaFormat];

export const isHeaderMediaFormat = (
  value: string | null,
): value is HeaderMediaFormat => value !== null && value in HEADER_MEDIA;

/** O formato de um arquivo pelo tipo, ou `null` se nenhuma mídia o aceita. */
export function headerMediaFormatOf(type: string): HeaderMediaFormat | null {
  for (const [format, media] of Object.entries(HEADER_MEDIA)) {
    if (type in media.types) return format as HeaderMediaFormat;
  }
  return null;
}

const extensionOf = (type: HeaderMediaType): string => {
  const format = headerMediaFormatOf(type)!;
  return (HEADER_MEDIA[format].types as Record<string, string>)[type];
};

/** Por que este arquivo não serve para esta mídia, ou `null` se serve. */
export function headerMediaFileProblem(
  format: HeaderMediaFormat,
  file: { type: string; size: number },
): string | null {
  const media = HEADER_MEDIA[format];
  if (headerMediaFormatOf(file.type) !== format) {
    return `O modelo pede ${media.label} no cabeçalho: ${media.hint}.`;
  }
  if (file.size === 0) return "O arquivo está vazio.";
  if (file.size > media.maxBytes) {
    return `O arquivo passa do limite: ${media.hint}.`;
  }
  return null;
}

/**
 * Por que este modelo não serve para esta mensagem, ou `null` se serve. A
 * lista separada precisa de cabeçalho de documento (o PDF de parceiros), as
 * confirmações podem ter documento ou nada, e os lembretes podem ter imagem,
 * documento, vídeo (o arquivo anexado em /whatsapp) ou nada.
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
  if (CONFIRMATION_KEYS.includes(key) && media && media !== "DOCUMENT") {
    return "A confirmação só pode levar documento no cabeçalho — o PDF de parceiros.";
  }
  if (isReminderKey(key) && media && !isHeaderMediaFormat(media)) {
    return "Os lembretes só podem levar imagem, documento ou vídeo no cabeçalho.";
  }
  return null;
}

/** O nome do arquivo no link: `reminder_d30.pdf`. */
export const headerMediaFileName = (
  key: MessageKey,
  mimeType: HeaderMediaType,
) => `${key}.${extensionOf(mimeType)}`;

/**
 * Caminho público do arquivo do cabeçalho — é este link que vai no WhatsApp.
 * O `v` muda a cada troca do arquivo: a Meta guarda o arquivo de um link por
 * um tempo, e o link novo faz o próximo envio já levar o arquivo novo.
 */
export const headerMediaPath = (
  key: MessageKey,
  file: { mimeType: HeaderMediaType; updatedAt: Date },
) =>
  `/arquivos/midia-dos-modelos/${headerMediaFileName(key, file.mimeType)}?v=${new Date(file.updatedAt).getTime()}`;
