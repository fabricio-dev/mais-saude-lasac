"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { generateIntegrationApiKey } from "@/data/whatsapp-connection";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const generateIntegrationKey = actionClient.action(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Usuário não encontrado");
  }
  if (session.user.role !== "admin") {
    throw new Error("Apenas administradores podem gerar a chave");
  }

  const rawKey = await generateIntegrationApiKey(session.user.id);

  revalidatePath("/whatsapp");
  // A única resposta que leva a chave inteira: o banco guarda só o hash.
  return { rawKey };
});
