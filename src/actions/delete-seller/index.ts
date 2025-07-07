"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import z from "zod";

import { db } from "@/db";
import { sellersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const deleteSeller = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const seller = await db.query.sellersTable.findFirst({
      where: eq(sellersTable.id, parsedInput.id),
    });
    if (!seller) {
      throw new Error("Vendedor não encontrado");
    }
    if (seller.clinicId !== session.user.clinic?.id) {
      throw new Error("Você não tem permissão para deletar esse vendedor");
    }
    await db.delete(sellersTable).where(eq(sellersTable.id, parsedInput.id));
    revalidatePath("/sellers");
  });
