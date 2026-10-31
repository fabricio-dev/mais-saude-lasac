"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import {
  getHeaderMediaInfo,
  saveHeaderMedia,
} from "@/data/whatsapp-header-media";
import { saveMessageTemplate } from "@/data/whatsapp-message-templates";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { listWhatsAppAiTemplates } from "@/lib/whatsapp/client";
import {
  HEADER_MEDIA,
  headerMediaFileProblem,
  type HeaderMediaFormat,
  headerMediaFormatOf,
  type HeaderMediaType,
  isHeaderMediaFormat,
  isReminderKey,
  mediaHeader,
  templateMismatch,
} from "@/lib/whatsapp/message-templates";

import { saveMessageTemplateSchema } from "./schema";

/** O tipo pela assinatura do arquivo: JPG, PNG, PDF ou MP4. */
function sniffType(content: Buffer): HeaderMediaType | null {
  if (content.subarray(0, 3).toString("hex") === "ffd8ff") return "image/jpeg";
  if (content.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return "image/png";
  }
  if (content.subarray(0, 5).toString("latin1") === "%PDF-") {
    return "application/pdf";
  }
  if (content.subarray(4, 8).toString("latin1") === "ftyp") return "video/mp4";
  return null;
}

/**
 * Confere o arquivo pela assinatura, e não pela extensão ou pelo que o
 * navegador diz: é este arquivo que vai para todo paciente do lembrete.
 */
async function readHeaderMedia(
  format: HeaderMediaFormat,
  file: File,
): Promise<
  | { ok: true; file: { content: Buffer; mimeType: HeaderMediaType } }
  | { ok: false; message: string }
> {
  const content = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffType(content);
  const problem = headerMediaFileProblem(format, {
    type: mimeType ?? "",
    size: content.byteLength,
  });
  if (problem || !mimeType) {
    return {
      ok: false,
      message: problem ?? `${HEADER_MEDIA[format].hint}.`,
    };
  }
  return { ok: true, file: { content, mimeType } };
}

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

    // Lembrete com mídia no cabeçalho: sem o arquivo a Meta recusa o envio,
    // então ou vem um agora, ou já tem um anexado do mesmo formato.
    const media = mediaHeader(template);
    const reminder = isReminderKey(parsedInput.key);
    const headerMedia = reminder && isHeaderMediaFormat(media) ? media : null;
    if (headerMedia && parsedInput.headerMedia) {
      const file = await readHeaderMedia(headerMedia, parsedInput.headerMedia);
      if (!file.ok) return fail(file.message);
      await saveHeaderMedia(
        parsedInput.key,
        { ...file.file, fileName: parsedInput.headerMedia.name },
        session.user.id,
      );
    } else if (headerMedia) {
      const stored = (await getHeaderMediaInfo()).get(parsedInput.key);
      if (!stored || headerMediaFormatOf(stored.mimeType) !== headerMedia) {
        return fail(
          `Este modelo tem ${HEADER_MEDIA[headerMedia].label} no cabeçalho: anexe o arquivo.`,
        );
      }
    }

    await saveMessageTemplate(
      parsedInput.key,
      {
        templateName: template.name,
        templateLanguage: template.language,
        params: parsedInput.params.map(({ source, text }) =>
          source === "fixed_text" ? { source, text } : { source },
        ),
        // O PDF de parceiros é só das confirmações e da lista separada.
        headerDocument: !reminder && media === "DOCUMENT",
        headerMedia,
      },
      session.user.id,
    );

    revalidatePath("/whatsapp");
    return { ok: true as const };
  });
