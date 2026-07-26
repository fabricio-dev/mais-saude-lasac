"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { cardPriceHistoryTable, cardPricesTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertCardPriceSchema } from "./schema";

export const upsertCardPrice = actionClient
  .schema(upsertCardPriceSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("Usuário não encontrado");
    }
    if (session.user.role !== "admin") {
      throw new Error("Apenas administradores podem gerenciar preços");
    }

    // Buscar preço atual da combinação para comparar e registrar no histórico
    const existingPrice = await db.query.cardPricesTable.findFirst({
      where: and(
        eq(cardPricesTable.operation, parsedInput.operation),
        eq(cardPricesTable.cardType, parsedInput.cardType),
      ),
    });

    // Valor não mudou — não atualiza nem gera histórico
    if (existingPrice?.amountInCents === parsedInput.amountInCents) {
      return;
    }

    // Upsert pela combinação (operation, cardType) — cada combinação tem no máximo 1 preço
    const [price] = await db
      .insert(cardPricesTable)
      .values({
        operation: parsedInput.operation,
        cardType: parsedInput.cardType,
        amountInCents: parsedInput.amountInCents,
      })
      .onConflictDoUpdate({
        target: [cardPricesTable.operation, cardPricesTable.cardType],
        set: {
          amountInCents: parsedInput.amountInCents,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Registrar a alteração no histórico
    await db.insert(cardPriceHistoryTable).values({
      cardPriceId: price.id,
      operation: parsedInput.operation,
      cardType: parsedInput.cardType,
      previousAmountInCents: existingPrice?.amountInCents ?? null,
      newAmountInCents: parsedInput.amountInCents,
      changedByUserId: session.user.id,
    });

    revalidatePath("/precos");
  });
