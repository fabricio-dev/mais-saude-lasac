import { z } from "zod";

export const upsertWhatsAppSettingsSchema = z.object({
  enabled: z.boolean(),
  reminderD7Enabled: z.boolean(),
  reminderD0Enabled: z.boolean(),
  reminderD0LateEnabled: z.boolean(),
  reminderD30Enabled: z.boolean(),
  overdueDailyLimit: z
    .number({ message: "Informe o limite" })
    .int()
    .min(1, { message: "Mínimo de 1 por dia" })
    // O número entrega 250 conversas por dia na faixa inicial da Meta, e
    // divide esse teto com o atendimento. Vale para o D0 atrasado e o D+30
    // juntos.
    .max(250, { message: "Máximo de 250 por dia" }),
  officialNumber: z
    .string()
    .trim()
    .refine((value) => [10, 11].includes(value.replace(/\D/g, "").length), {
      message: "Use DDD + número, como no cadastro",
    }),
  sendHour: z.number().int().min(0).max(23),
  sendDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, { message: "Escolha pelo menos um dia" }),
});

export type UpsertWhatsAppSettingsInput = z.infer<
  typeof upsertWhatsAppSettingsSchema
>;
