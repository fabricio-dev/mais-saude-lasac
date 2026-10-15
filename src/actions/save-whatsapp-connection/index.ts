"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { saveWhatsAppAiConnection } from "@/data/whatsapp-connection";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { saveWhatsAppConnectionSchema } from "./schema";

export const saveWhatsAppConnection = actionClient
  .schema(saveWhatsAppConnectionSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }
    if (session.user.role !== "admin") {
      throw new Error("Apenas administradores podem configurar o WhatsApp");
    }

    // Devolvido, e não lançado: o erro lançado chega à tela como mensagem
    // genérica, e este precisa dizer o que falta configurar.
    if (parsedInput.apiKey && !process.env.SETTINGS_ENCRYPTION_KEY) {
      return {
        ok: false as const,
        message:
          "Falta a SETTINGS_ENCRYPTION_KEY no servidor: sem ela a chave não pode ser guardada.",
      };
    }

    await saveWhatsAppAiConnection(
      {
        url: parsedInput.url,
        apiKey: parsedInput.apiKey || undefined,
      },
      session.user.id,
    );

    revalidatePath("/whatsapp");
    return { ok: true as const };
  });
