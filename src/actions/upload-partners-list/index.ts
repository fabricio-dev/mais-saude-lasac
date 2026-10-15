"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { savePartnersListFile } from "@/data/partners-list-file";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

/** A Meta aceita documento de até 100 MB; uma lista de parceiros tem poucos. */
const MAX_BYTES = 10 * 1024 * 1024;

export const uploadPartnersList = actionClient
  .schema(z.instanceof(FormData))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }
    if (session.user.role !== "admin") {
      throw new Error("Apenas administradores podem trocar a lista");
    }

    const file = parsedInput.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Escolha um arquivo PDF");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("O arquivo passa de 10 MB");
    }

    const content = Buffer.from(await file.arrayBuffer());
    // Pela assinatura do arquivo, e não pela extensão: é este PDF que vai para
    // todo paciente ativado.
    if (content.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new Error("O arquivo não é um PDF");
    }

    await savePartnersListFile(
      { content, fileName: file.name },
      session.user.id,
    );

    revalidatePath("/whatsapp");
  });
