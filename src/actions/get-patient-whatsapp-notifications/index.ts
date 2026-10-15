"use server";

import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { whatsappNotificationsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getPatientWhatsAppNotifications = actionClient
  .schema(z.object({ patientId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }
    if (session.user.role !== "admin") {
      throw new Error("Apenas administradores podem ver os lembretes");
    }

    return db
      .select({
        id: whatsappNotificationsTable.id,
        notificationType: whatsappNotificationsTable.notificationType,
        status: whatsappNotificationsTable.status,
        sentAt: whatsappNotificationsTable.sentAt,
        createdAt: whatsappNotificationsTable.createdAt,
        failureReason: whatsappNotificationsTable.failureReason,
      })
      .from(whatsappNotificationsTable)
      .where(eq(whatsappNotificationsTable.patientId, parsedInput.patientId))
      .orderBy(desc(whatsappNotificationsTable.createdAt));
  });
