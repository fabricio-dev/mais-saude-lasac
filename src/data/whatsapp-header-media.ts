import { eq } from "drizzle-orm";

import { db } from "@/db";
import { whatsappHeaderMediaTable } from "@/db/schema";
import {
  headerMediaFormatOf,
  type HeaderMediaType,
  type MessageKey,
} from "@/lib/whatsapp/message-templates";

export type HeaderMediaInfo = {
  mimeType: HeaderMediaType;
  fileName: string;
  sizeBytes: number;
  updatedAt: Date;
};

const isHeaderMediaType = (type: string): type is HeaderMediaType =>
  headerMediaFormatOf(type) !== null;

/** Os dados do arquivo de cada mensagem, sem o conteúdo — para a tela e o envio. */
export async function getHeaderMediaInfo(): Promise<
  Map<string, HeaderMediaInfo>
> {
  const rows = await db
    .select({
      key: whatsappHeaderMediaTable.key,
      mimeType: whatsappHeaderMediaTable.mimeType,
      fileName: whatsappHeaderMediaTable.fileName,
      sizeBytes: whatsappHeaderMediaTable.sizeBytes,
      updatedAt: whatsappHeaderMediaTable.updatedAt,
    })
    .from(whatsappHeaderMediaTable);

  return new Map(
    rows.flatMap(({ key, mimeType, ...info }) =>
      isHeaderMediaType(mimeType) ? [[key, { mimeType, ...info }]] : [],
    ),
  );
}

export async function getHeaderMedia(key: MessageKey) {
  const [row] = await db
    .select()
    .from(whatsappHeaderMediaTable)
    .where(eq(whatsappHeaderMediaTable.key, key));

  return row ?? null;
}

export async function saveHeaderMedia(
  key: MessageKey,
  file: { content: Buffer; mimeType: HeaderMediaType; fileName: string },
  userId: string,
): Promise<void> {
  const values = {
    content: file.content,
    mimeType: file.mimeType,
    fileName: file.fileName,
    sizeBytes: file.content.byteLength,
    updatedAt: new Date(),
    updatedByUserId: userId,
  };

  await db
    .insert(whatsappHeaderMediaTable)
    .values({ key, ...values })
    .onConflictDoUpdate({ target: whatsappHeaderMediaTable.key, set: values });
}
