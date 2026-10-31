import { db } from "@/db";
import { whatsappMessageTemplatesTable } from "@/db/schema";
import {
  DEFAULT_MESSAGE_TEMPLATES,
  isHeaderMediaFormat,
  MESSAGE_KEYS,
  type MessageKey,
  type MessageTemplateConfig,
  type TemplateParam,
  VARIABLE_SOURCES,
} from "@/lib/whatsapp/message-templates";

import {
  getHeaderMediaInfo,
  type HeaderMediaInfo,
} from "./whatsapp-header-media";

const isParam = (value: unknown): value is TemplateParam =>
  typeof value === "object" &&
  value !== null &&
  VARIABLE_SOURCES.includes((value as TemplateParam).source);

export type MessageTemplateSetting = MessageTemplateConfig & {
  /** Ainda não escolhido pela tela: vale o padrão de antes. */
  isDefault: boolean;
  updatedAt: Date | null;
  /**
   * O arquivo anexado para esta mensagem, quando há. Fica guardado mesmo com
   * um modelo sem mídia escolhido: volta a valer se ele trocar de volta.
   */
  headerMediaFile: HeaderMediaInfo | null;
};

/** O modelo de cada mensagem: o escolhido na tela, ou o padrão. */
export async function getMessageTemplates(): Promise<
  Record<MessageKey, MessageTemplateSetting>
> {
  const [rows, mediaFiles] = await Promise.all([
    db.select().from(whatsappMessageTemplatesTable),
    getHeaderMediaInfo(),
  ]);
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return Object.fromEntries(
    MESSAGE_KEYS.map((key) => {
      const row = byKey.get(key);
      const headerMediaFile = mediaFiles.get(key) ?? null;
      if (!row) {
        return [
          key,
          {
            ...DEFAULT_MESSAGE_TEMPLATES[key],
            isDefault: true,
            updatedAt: null,
            headerMediaFile,
          },
        ];
      }
      return [
        key,
        {
          templateName: row.templateName,
          templateLanguage: row.templateLanguage,
          params: row.params.filter(isParam),
          headerDocument: row.headerDocument,
          headerMedia: isHeaderMediaFormat(row.headerMedia)
            ? row.headerMedia
            : null,
          isDefault: false,
          updatedAt: row.updatedAt,
          headerMediaFile,
        },
      ];
    }),
  ) as Record<MessageKey, MessageTemplateSetting>;
}

export async function saveMessageTemplate(
  key: MessageKey,
  config: MessageTemplateConfig,
  userId: string,
): Promise<void> {
  const values = {
    templateName: config.templateName,
    templateLanguage: config.templateLanguage,
    params: config.params,
    headerDocument: config.headerDocument,
    headerMedia: config.headerMedia,
    updatedAt: new Date(),
    updatedByUserId: userId,
  };

  await db
    .insert(whatsappMessageTemplatesTable)
    .values({ key, ...values })
    .onConflictDoUpdate({
      target: whatsappMessageTemplatesTable.key,
      set: values,
    });
}
