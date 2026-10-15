import { db } from "@/db";
import { whatsappMessageTemplatesTable } from "@/db/schema";
import {
  DEFAULT_MESSAGE_TEMPLATES,
  MESSAGE_KEYS,
  type MessageKey,
  type MessageTemplateConfig,
  type TemplateParam,
  VARIABLE_SOURCES,
} from "@/lib/whatsapp/message-templates";

const isParam = (value: unknown): value is TemplateParam =>
  typeof value === "object" &&
  value !== null &&
  VARIABLE_SOURCES.includes((value as TemplateParam).source);

export type MessageTemplateSetting = MessageTemplateConfig & {
  /** Ainda não escolhido pela tela: vale o padrão de antes. */
  isDefault: boolean;
  updatedAt: Date | null;
};

/** O modelo de cada mensagem: o escolhido na tela, ou o padrão. */
export async function getMessageTemplates(): Promise<
  Record<MessageKey, MessageTemplateSetting>
> {
  const rows = await db.select().from(whatsappMessageTemplatesTable);
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return Object.fromEntries(
    MESSAGE_KEYS.map((key) => {
      const row = byKey.get(key);
      if (!row) {
        return [
          key,
          {
            ...DEFAULT_MESSAGE_TEMPLATES[key],
            isDefault: true,
            updatedAt: null,
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
          isDefault: false,
          updatedAt: row.updatedAt,
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
