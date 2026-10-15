/**
 * Envio de WhatsApp pelo sistema de atendimento (whatsapp-ai).
 *
 * O número é o mesmo do atendimento, e o envio é pedido ao whatsapp-ai em vez
 * de ir direto para a Meta: assim a mensagem aparece na ficha do paciente, a
 * resposta dele cai no atendimento já com o aviso na conversa, e quem pediu
 * para sair no WhatsApp não recebe (o whatsapp-ai aplica o descadastro).
 *
 * Contrato: POST {WHATSAPP_AI_URL}/api/integrations/v1/messages
 * Chave: gerada em whatsapp-ai → Configurações → Integrações.
 */

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
  | { success: false; error: string };

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 10_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log(
      `WhatsApp desabilitado. "${params.templateName}" não enviado para ${maskPhoneNumber(params.phoneNumber)}`,
    );
    return { success: false, error: "WhatsApp está desabilitado no ambiente" };
  }

  const baseUrl = process.env.WHATSAPP_AI_URL?.replace(/\/+$/, "");
  const apiKey = process.env.WHATSAPP_AI_API_KEY;
  if (!baseUrl || !apiKey) {
    console.error("WHATSAPP_AI_URL ou WHATSAPP_AI_API_KEY não configurados");
    return {
      success: false,
      error: "Configuração do sistema de atendimento ausente",
    };
  }

  const body = JSON.stringify({
    externalId: params.externalId,
    to: params.phoneNumber,
    name: params.patientName,
    category: params.category,
    template: {
      name: params.templateName,
      language: "pt_BR",
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

  const destino = maskPhoneNumber(params.phoneNumber);
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

      // Pedido recusado (chave, formato, template): repetir não muda nada.
      const passageiro = response.status >= 500 || response.status === 429;
      if (!passageiro) {
        console.error(
          `Envio de "${params.templateName}" para ${destino} recusado: ${lastError}`,
        );
        return { success: false, error: lastError };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erro desconhecido";
    }

    console.error(
      `Tentativa ${attempt}/${MAX_ATTEMPTS} de "${params.templateName}" para ${destino} falhou: ${lastError}`,
    );
    if (attempt < MAX_ATTEMPTS) await wait(1000 * attempt);
  }

  return { success: false, error: lastError };
}
