"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { sellersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertSellerSchema } from "./schema";

export const upsertSeller = actionClient
  .schema(upsertSellerSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.clinic?.id) {
      throw new Error("Clínica não encontrada");
    }

    await db
      .insert(sellersTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId: parsedInput.unity, // mudei para o id para testar
      })
      .onConflictDoUpdate({
        target: [sellersTable.id],
        set: { ...parsedInput, clinicId: parsedInput.unity },
      });
    revalidatePath("/sellers");
  });
