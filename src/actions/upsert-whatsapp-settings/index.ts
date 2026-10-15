"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { saveWhatsAppSettings } from "@/data/whatsapp-settings";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertWhatsAppSettingsSchema } from "./schema";

export const upsertWhatsAppSettings = actionClient
  .schema(upsertWhatsAppSettingsSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }
    if (session.user.role !== "admin") {
      throw new Error("Apenas administradores podem configurar o WhatsApp");
    }

    await saveWhatsAppSettings(
      {
        ...parsedInput,
        officialNumber: parsedInput.officialNumber.replace(/\D/g, ""),
        sendDays: [...new Set(parsedInput.sendDays)].sort(),
      },
      session.user.id,
    );

    revalidatePath("/whatsapp");
  });
