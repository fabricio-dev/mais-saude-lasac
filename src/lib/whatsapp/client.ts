/**
 * Envio de WhatsApp pelo sistema de atendimento (whatsapp-ai).
 *
 * O número é o mesmo do atendimento, e o envio é pedido ao whatsapp-ai em vez
 * de ir direto para a Meta: assim a mensagem aparece na ficha do paciente, a
 * resposta dele cai no atendimento já com o aviso na conversa, e quem pediu
 * para sair no WhatsApp não recebe (o whatsapp-ai aplica o descadastro).
 *
 * Contrato: POST {endereço do whatsapp-ai}/api/integrations/v1/messages
 * Endereço e chave: tela /whatsapp (a chave é gerada no whatsapp-ai, em
 * Configurações → Integrações).
 */

import { getWhatsAppAiCredentials } from "@/data/whatsapp-connection";
import { getWhatsAppSettings } from "@/data/whatsapp-settings";

import { maskPhoneNumber } from "./utils";

/** Arquivo do cabeçalho do template, por URL pública (só https). */
interface TemplateDocument {
  link: string;
  filename: string;
}

export interface SendTemplateParams {
  /**
   * Identifica o envio. O mesmo valor nunca envia duas vezes — é o que deixa
   * repetir a chamada com segurança depois de timeout.
   */
  externalId: string;
  phoneNumber: string;
  /** Preenche a ficha do paciente no atendimento, quando ela está sem nome. */
  patientName?: string;
  /** Rótulo do envio no relatório do atendimento ("Vencimento em 7 dias"). */
  category: string;
  templateName: string;
  /** Idioma do modelo aprovado. Padrão pt_BR. */
  language?: string;
  parameters: string[];
  document?: TemplateDocument;
}

export type SendTemplateResult =
  | {
      success: true;
      /** `queued`: vai sair. `skipped`: paciente descadastrado ou bloqueado. */
      status: "queued" | "skipped";
      id: string;
      reason: string | null;
      duplicate: boolean;
    }
  | {
      success: false;
      error: string;
      /**
       * Vale tentar de novo numa próxima execução. Falso só para telefone
       * inválido, que é do cadastro do paciente; todo o resto (rede, sistema
       * fora do ar, template, variáveis, chave) se resolve com uma correção.
       */
      retryable: boolean;
    };

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 10_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Em DEV, todo envio vai para WHATSAPP_TEST_PHONE — confirmações e lembretes.
 * Fica aqui, e não em quem chama, para nenhum tipo de mensagem escapar: um
 * banco de dev copiado da produção tem os telefones reais dos pacientes.
 */
function applyDevProtection(phoneNumber: string): string {
  const whatsappEnv = process.env.WHATSAPP_ENV || "dev";
  const testPhone = process.env.WHATSAPP_TEST_PHONE;

  if (whatsappEnv === "dev" && testPhone) {
    console.log(
      `[DEV] Redirecionando envio de ${maskPhoneNumber(phoneNumber)} para ${maskPhoneNumber(testPhone)}`,
    );
    return testPhone;
  }

  return phoneNumber;
}

/**
 * Pede o envio de um template aprovado ao whatsapp-ai.
 *
 * Tenta de novo só quando o problema pode ser passageiro (rede, timeout, 5xx,
 * 429). Repetir é seguro porque o `externalId` é o mesmo: o whatsapp-ai devolve
 * o primeiro envio em vez de mandar outro.
 */
export async function sendWhatsAppTemplate(
  params: SendTemplateParams,
): Promise<SendTemplateResult> {
  const { enabled } = await getWhatsAppSettings();
  if (!enabled) {
    console.log(
      `WhatsApp desabilitado. "${params.templateName}" não enviado para ${maskPhoneNumber(params.phoneNumber)}`,
    );
    return {
      success: false,
      error: "Envios de WhatsApp desligados em /whatsapp",
      retryable: true,
    };
  }

  let credentials: Awaited<ReturnType<typeof getWhatsAppAiCredentials>>;
  try {
    credentials = await getWhatsAppAiCredentials();
  } catch (error) {
    // Chave cifrada que não abre: SETTINGS_ENCRYPTION_KEY ausente ou trocada.
    console.error(
      "Não foi possível ler a chave do sistema de atendimento:",
      error,
    );
    credentials = null;
  }
  if (!credentials) {
    console.error(
      "Conexão com o sistema de atendimento não configurada em /whatsapp",
    );
    return {
      success: false,
      error: "Conexão com o sistema de atendimento não configurada",
      retryable: true,
    };
  }
  const { url: baseUrl, apiKey } = credentials;

  const phoneNumber = applyDevProtection(params.phoneNumber);

  const body = JSON.stringify({
    externalId: params.externalId,
    to: phoneNumber,
    name: params.patientName,
    category: params.category,
    template: {
      name: params.templateName,
      language: params.language ?? "pt_BR",
      params: params.parameters,
    },
    ...(params.document
      ? {
          header: {
            type: "document",
            link: params.document.link,
            filename: params.document.filename,
          },
        }
      : {}),
  });

  const destino = maskPhoneNumber(phoneNumber);
  let lastError = "Falha ao enviar após todas as tentativas";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/api/integrations/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const data = (await response.json().catch(() => null)) as {
        id?: string;
        status?: "queued" | "skipped";
        reason?: string | null;
        duplicate?: boolean;
        error?: string;
        message?: string;
      } | null;

      if (response.ok && data?.id && data.status) {
        console.log(
          `✅ "${params.templateName}" para ${destino}: ${data.status}` +
            (data.reason ? ` (${data.reason})` : "") +
            (data.duplicate ? " — já enviado antes" : ""),
        );
        return {
          success: true,
          status: data.status,
          id: data.id,
          reason: data.reason ?? null,
          duplicate: data.duplicate ?? false,
        };
      }

      lastError =
        data?.message ?? data?.error ?? `Erro HTTP ${response.status}`;

      // Repetir agora não muda nada. Mas só o telefone inválido é do paciente:
      // template pausado na Meta, variáveis erradas, chave ou recurso
      // desligado atingem o lote inteiro e se resolvem com uma correção — a
      // próxima execução tenta de novo, em vez de perder o lote do dia.
      const passageiro = response.status >= 500 || response.status === 429;
      if (!passageiro) {
        console.error(
          `Envio de "${params.templateName}" para ${destino} recusado: ${lastError}`,
        );
        return {
          success: false,
          error: lastError,
          retryable: data?.error !== "invalid_phone",
        };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erro desconhecido";
    }

    console.error(
      `Tentativa ${attempt}/${MAX_ATTEMPTS} de "${params.templateName}" para ${destino} falhou: ${lastError}`,
    );
    if (attempt < MAX_ATTEMPTS) await wait(1000 * attempt);
  }

  return { success: false, error: lastError, retryable: true };
}

/** Um modelo aprovado na conta do WhatsApp, como o whatsapp-ai o descreve. */
export type WhatsAppAiTemplate = {
  name: string;
  language: string;
  category: string;
  body: string;
  footer: string | null;
  /** `DOCUMENT`, `IMAGE`, `VIDEO`, `TEXT` ou nulo quando não tem cabeçalho. */
  headerFormat: string | null;
  variables: number;
  examples: string[];
  buttons: { type: string; text: string }[];
  /** Motivo de o whatsapp-ai não conseguir enviar este modelo, quando há. */
  unsupported: string | null;
};

export type ListTemplatesResult =
  | { ok: true; templates: WhatsAppAiTemplate[] }
  | { ok: false; message: string };

/** Os modelos aprovados, para a escolha na tela /whatsapp. */
export async function listWhatsAppAiTemplates(): Promise<ListTemplatesResult> {
  let credentials: Awaited<ReturnType<typeof getWhatsAppAiCredentials>>;
  try {
    credentials = await getWhatsAppAiCredentials();
  } catch {
    credentials = null;
  }
  if (!credentials) {
    return {
      ok: false,
      message: "Configure a conexão com o sistema de atendimento primeiro.",
    };
  }

  try {
    const response = await fetch(
      `${credentials.url}/api/integrations/v1/templates`,
      {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      },
    );
    const data = (await response.json().catch(() => null)) as {
      templates?: WhatsAppAiTemplate[];
      message?: string;
    } | null;

    if (!response.ok || !data?.templates) {
      return {
        ok: false,
        message:
          data?.message ??
          `O sistema de atendimento respondeu ${response.status}.`,
      };
    }
    return { ok: true, templates: data.templates };
  } catch {
    return {
      ok: false,
      message: "Não foi possível falar com o sistema de atendimento.",
    };
  }
}
