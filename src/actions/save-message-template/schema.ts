import { z } from "zod";

import { boundedArray } from "@/helpers/bounded-array";
import {
  MESSAGE_KEYS,
  VARIABLE_SOURCES,
} from "@/lib/whatsapp/message-templates";

/** Bem acima do que um modelo da Meta usa; só para a lista ter teto. */
export const MAX_TEMPLATE_PARAMS = 50;

export const saveMessageTemplateSchema = z.object({
  key: z.enum(MESSAGE_KEYS),
  templateName: z.string().trim().min(1, { message: "Escolha um modelo" }),
  templateLanguage: z.string().trim().min(2),
  // A action confere se bate com as variáveis do modelo; o teto só barra
  // requisição forjada antes de o zod validar item por item
  params: boundedArray(
    z.array(
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
    MAX_TEMPLATE_PARAMS,
  ),
  /** Arquivo novo para o cabeçalho; sem ele, vale o já anexado. */
  headerMedia: z.instanceof(File).optional(),
});

export type SaveMessageTemplateInput = z.infer<
  typeof saveMessageTemplateSchema
>;
