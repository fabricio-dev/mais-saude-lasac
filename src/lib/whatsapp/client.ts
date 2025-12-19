/**
 * Cliente para WhatsApp Business API (Meta)
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

interface WhatsAppTextMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: {
    body: string;
  };
}

interface WhatsAppTemplateMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
  };
}

interface SendMessageParams {
  phoneNumber: string;
  message: string;
  maxRetries?: number;
}

interface SendTemplateParams {
  phoneNumber: string;
  templateName: string;
  parameters: string[];
  maxRetries?: number;
}

interface SendTemplateWithDocumentParams {
  phoneNumber: string;
  templateName: string;
  documentUrl: string;
  maxRetries?: number;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia uma mensagem usando template pré-aprovado do WhatsApp Business API
 * Esta é a forma OFICIAL e RECOMENDADA para enviar mensagens
 */
export async function sendWhatsAppTemplate({
  phoneNumber,
  templateName,
  parameters,
  maxRetries = 2,
}: SendTemplateParams): Promise<SendMessageResult> {
  // Verificar se WhatsApp está habilitado
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log(
      "WhatsApp desabilitado. Template não enviado para:",
      phoneNumber,
    );
    return {
      success: false,
      error: "WhatsApp está desabilitado no ambiente",
    };
  }

  // Validar configurações
  const apiUrl = process.env.WHATSAPP_API_URL;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiUrl || !accessToken || !phoneNumberId) {
    console.error("Configurações do WhatsApp incompletas");
    return {
      success: false,
      error: "Configurações do WhatsApp não encontradas",
    };
  }

  // Formatar número de telefone (remover caracteres especiais)
  const formattedPhone = phoneNumber.replace(/\D/g, "");

  if (!formattedPhone || formattedPhone.length < 10) {
    console.error("Número de telefone inválido:", phoneNumber);
    return {
      success: false,
      error: "Número de telefone inválido",
    };
  }

  // Preparar mensagem com template
  const payload: WhatsAppTemplateMessage = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "pt_BR",
      },
      components: [
        {
          type: "body",
          parameters: parameters.map((param) => ({
            type: "text",
            text: param,
          })),
        },
      ],
    },
  };

  // Tentar enviar com retries
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Tentativa ${attempt}/${maxRetries} - Enviando template WhatsApp "${templateName}" para ${formattedPhone}`,
      );

      const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as WhatsAppError;
        lastError =
          errorData.error?.message ||
          `Erro HTTP ${response.status}: ${response.statusText}`;
        console.error(
          `Erro ao enviar template WhatsApp (tentativa ${attempt}):`,
          lastError,
        );

        // Se for erro de parâmetro inválido ou template não encontrado, não tentar novamente
        if (
          errorData.error?.code === 100 ||
          errorData.error?.code === 131026 ||
          errorData.error?.code === 132000
        ) {
          return {
            success: false,
            error: lastError,
          };
        }

        // Esperar antes de tentar novamente
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
        continue;
      }

      const data = (await response.json()) as WhatsAppResponse;
      const messageId = data.messages?.[0]?.id;

      console.log(
        `✅ Template WhatsApp "${templateName}" enviado com sucesso para ${formattedPhone} - ID: ${messageId}`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erro desconhecido";
      console.error(
        `Erro ao enviar template WhatsApp (tentativa ${attempt}):`,
        lastError,
      );

      // Esperar antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError || "Falha ao enviar template após todas as tentativas",
  };
}

/**
 * Envia uma mensagem de texto via WhatsApp Business API
 * ⚠️ ATENÇÃO: Mensagens de texto livre só funcionam dentro de janela de 24h
 * Para notificações, use sendWhatsAppTemplate()
 */
export async function sendWhatsAppMessage({
  phoneNumber,
  message,
  maxRetries = 2,
}: SendMessageParams): Promise<SendMessageResult> {
  // Verificar se WhatsApp está habilitado
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log(
      "WhatsApp desabilitado. Mensagem não enviada para:",
      phoneNumber,
    );
    return {
      success: false,
      error: "WhatsApp está desabilitado no ambiente",
    };
  }

  // Validar configurações
  const apiUrl = process.env.WHATSAPP_API_URL;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiUrl || !accessToken || !phoneNumberId) {
    console.error("Configurações do WhatsApp incompletas");
    return {
      success: false,
      error: "Configurações do WhatsApp não encontradas",
    };
  }

  // Formatar número de telefone (remover caracteres especiais)
  const formattedPhone = phoneNumber.replace(/\D/g, "");

  if (!formattedPhone || formattedPhone.length < 10) {
    console.error("Número de telefone inválido:", phoneNumber);
    return {
      success: false,
      error: "Número de telefone inválido",
    };
  }

  // Preparar mensagem de texto
  const payload: WhatsAppTextMessage = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "text",
    text: {
      body: message,
    },
  };

  // Tentar enviar com retries
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Tentativa ${attempt}/${maxRetries} - Enviando WhatsApp para ${formattedPhone}`,
      );

      const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as WhatsAppError;
        lastError =
          errorData.error?.message ||
          `Erro HTTP ${response.status}: ${response.statusText}`;
        console.error(
          `Erro ao enviar WhatsApp (tentativa ${attempt}):`,
          lastError,
        );

        // Se for erro de parâmetro inválido, não tentar novamente
        if (errorData.error?.code === 100 || errorData.error?.code === 131026) {
          return {
            success: false,
            error: lastError,
          };
        }

        // Esperar antes de tentar novamente
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
        continue;
      }

      const data = (await response.json()) as WhatsAppResponse;
      const messageId = data.messages?.[0]?.id;

      console.log(
        `✅ WhatsApp enviado com sucesso para ${formattedPhone} - ID: ${messageId}`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erro desconhecido";
      console.error(
        `Erro ao enviar WhatsApp (tentativa ${attempt}):`,
        lastError,
      );

      // Esperar antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError || "Falha ao enviar mensagem após todas as tentativas",
  };
}

/**
 * Envia um template de forma assíncrona (não bloqueia o processo)
 * Útil para não bloquear a ativação do paciente caso o WhatsApp falhe
 * RECOMENDADO para notificações automáticas
 */
export function sendWhatsAppTemplateAsync(
  params: SendTemplateParams,
): Promise<SendMessageResult> {
  // Executar em background sem bloquear
  return sendWhatsAppTemplate(params).catch((error) => {
    console.error("Erro crítico ao enviar template WhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  });
}

/**
 * Envia uma mensagem de texto de forma assíncrona (não bloqueia o processo)
 * ⚠️ ATENÇÃO: Só funciona dentro de janela de 24h após cliente responder
 */
export function sendWhatsAppMessageAsync(
  params: SendMessageParams,
): Promise<SendMessageResult> {
  // Executar em background sem bloquear
  return sendWhatsAppMessage(params).catch((error) => {
    console.error("Erro crítico ao enviar WhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  });
}

/**
 * Envia um template com documento (PDF) via WhatsApp Business API
 * Usado para enviar lista de parceiros após ativação
 */
export async function sendWhatsAppTemplateWithDocument({
  phoneNumber,
  templateName,
  documentUrl,
  maxRetries = 2,
}: SendTemplateWithDocumentParams): Promise<SendMessageResult> {
  // Verificar se WhatsApp está habilitado
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log(
      "WhatsApp desabilitado. Documento não enviado para:",
      phoneNumber,
    );
    return {
      success: false,
      error: "WhatsApp está desabilitado no ambiente",
    };
  }

  // Validar configurações
  const apiUrl = process.env.WHATSAPP_API_URL;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiUrl || !accessToken || !phoneNumberId) {
    console.error("Configurações do WhatsApp incompletas");
    return {
      success: false,
      error: "Configurações do WhatsApp não encontradas",
    };
  }

  // Formatar número de telefone
  const formattedPhone = phoneNumber.replace(/\D/g, "");

  if (!formattedPhone || formattedPhone.length < 10) {
    console.error("Número de telefone inválido:", phoneNumber);
    return {
      success: false,
      error: "Número de telefone inválido",
    };
  }

  // Preparar template com documento
  const payload = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "pt_BR",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: documentUrl,
                filename: "Lista de Parceiros - Mais Saúde.pdf",
              },
            },
          ],
        },
      ],
    },
  };

  // Tentar enviar com retries
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Tentativa ${attempt}/${maxRetries} - Enviando documento WhatsApp "${templateName}" para ${formattedPhone}`,
      );

      const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as WhatsAppError;
        lastError =
          errorData.error?.message ||
          `Erro HTTP ${response.status}: ${response.statusText}`;
        console.error(
          `Erro ao enviar documento WhatsApp (tentativa ${attempt}):`,
          lastError,
        );

        // Se for erro de parâmetro inválido ou template não encontrado, não tentar novamente
        if (
          errorData.error?.code === 100 ||
          errorData.error?.code === 131026 ||
          errorData.error?.code === 132000
        ) {
          return {
            success: false,
            error: lastError,
          };
        }

        // Esperar antes de tentar novamente
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
        continue;
      }

      const data = (await response.json()) as WhatsAppResponse;
      const messageId = data.messages?.[0]?.id;

      console.log(
        `✅ Documento WhatsApp "${templateName}" enviado com sucesso para ${formattedPhone} - ID: ${messageId}`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Erro desconhecido";
      console.error(
        `Erro ao enviar documento WhatsApp (tentativa ${attempt}):`,
        lastError,
      );

      // Esperar antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError || "Falha ao enviar documento após todas as tentativas",
  };
}

/**
 * Envia um template com documento de forma assíncrona
 * Com delay opcional antes do envio
 */
export async function sendWhatsAppTemplateWithDocumentAsync(
  params: SendTemplateWithDocumentParams,
  delayMs = 0,
): Promise<SendMessageResult> {
  // Aguardar delay se especificado
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Executar em background sem bloquear
  return sendWhatsAppTemplateWithDocument(params).catch((error) => {
    console.error("Erro crítico ao enviar documento WhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  });
}
