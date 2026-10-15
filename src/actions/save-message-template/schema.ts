import { z } from "zod";

import {
  MESSAGE_KEYS,
  VARIABLE_SOURCES,
} from "@/lib/whatsapp/message-templates";

export const saveMessageTemplateSchema = z.object({
  key: z.enum(MESSAGE_KEYS),
  templateName: z.string().trim().min(1, { message: "Escolha um modelo" }),
  templateLanguage: z.string().trim().min(2),
  params: z.array(
    z
      .object({
        source: z.enum(VARIABLE_SOURCES),
        text: z.string().trim().max(200).optional(),
      })
      .refine((param) => param.source !== "fixed_text" || !!param.text, {
        message: "Escreva o texto",
        path: ["text"],
      }),
  ),
});

export type SaveMessageTemplateInput = z.infer<
  typeof saveMessageTemplateSchema
>;
