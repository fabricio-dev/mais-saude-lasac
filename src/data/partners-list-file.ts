import { eq } from "drizzle-orm";

import { db } from "@/db";
import { partnersListFileTable } from "@/db/schema";

const FILE_ID = "default";

/** Caminho público do PDF — é este link que vai no WhatsApp. */
export const PARTNERS_LIST_PATH = "/arquivos/lista-de-parceiros.pdf";

export type PartnersListFileInfo = {
  fileName: string;
  sizeBytes: number;
  updatedAt: Date;
};

/** Os dados do arquivo, sem o conteúdo — para a tela. */
export async function getPartnersListFileInfo(): Promise<PartnersListFileInfo | null> {
  const [row] = await db
    .select({
      fileName: partnersListFileTable.fileName,
      sizeBytes: partnersListFileTable.sizeBytes,
      updatedAt: partnersListFileTable.updatedAt,
    })
    .from(partnersListFileTable)
    .where(eq(partnersListFileTable.id, FILE_ID));

  return row ?? null;
}

export async function getPartnersListFile() {
  const [row] = await db
    .select()
    .from(partnersListFileTable)
    .where(eq(partnersListFileTable.id, FILE_ID));

  return row ?? null;
}

export async function savePartnersListFile(
  file: { content: Buffer; fileName: string },
  userId: string,
): Promise<void> {
  const values = {
    content: file.content,
    fileName: file.fileName,
    sizeBytes: file.content.byteLength,
    updatedAt: new Date(),
    updatedByUserId: userId,
  };

  await db
    .insert(partnersListFileTable)
    .values({ id: FILE_ID, ...values })
    .onConflictDoUpdate({ target: partnersListFileTable.id, set: values });
}
