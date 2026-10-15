"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { saveMessageTemplate } from "@/data/whatsapp-message-templates";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { listWhatsAppAiTemplates } from "@/lib/whatsapp/client";
import {
  mediaHeader,
  templateMismatch,
} from "@/lib/whatsapp/message-templates";

import { saveMessageTemplateSchema } from "./schema";

/**
 * Salva o modelo de uma mensagem, conferido contra o catálogo de agora: o que
 * passar daqui sai sem recusa do whatsapp-ai por modelo ou variável errados.
 *
 * As recusas voltam no resultado, e não lançadas: o erro lançado chega à tela
 * como mensagem genérica, e estas precisam dizer o que corrigir.
 */
export const saveMessageTemplateAction = actionClient
  .schema(saveMessageTemplateSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }
    if (session.user.role !== "admin") {
      throw new Error("Apenas administradores podem configurar o WhatsApp");
    }

    const fail = (message: string) => ({ ok: false as const, message });

    const catalog = await listWhatsAppAiTemplates();
    if (!catalog.ok) return fail(catalog.message);

    const template = catalog.templates.find(
      (item) =>
        item.name === parsedInput.templateName &&
        item.language === parsedInput.templateLanguage,
    );
    if (!template) {
      return fail("Este modelo não está mais aprovado. Recarregue a página.");
    }
    const mismatch = templateMismatch(parsedInput.key, template);
    if (mismatch) return fail(mismatch);

    if (parsedInput.params.length !== template.variables) {
      return fail(
        `O modelo pede ${template.variables} variáveis, e foram configuradas ${parsedInput.params.length}.`,
      );
    }

    await saveMessageTemplate(
      parsedInput.key,
      {
        templateName: template.name,
        templateLanguage: template.language,
        params: parsedInput.params.map(({ source, text }) =>
          source === "fixed_text" ? { source, text } : { source },
        ),
        headerDocument: mediaHeader(template) === "DOCUMENT",
      },
      session.user.id,
    );

    revalidatePath("/whatsapp");
    return { ok: true as const };
  });
