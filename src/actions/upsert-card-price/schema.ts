import { z } from "zod";

export const upsertCardPriceSchema = z.object({
  id: z.string().uuid().optional(),
  operation: z.enum(["activation", "renewal"], {
    message: "Operação é obrigatória",
  }),
  cardType: z.enum(["personal", "enterprise"], {
    message: "Tipo de cartão é obrigatório",
  }),
  amountInCents: z
    .number({ message: "Valor é obrigatório" })
    .int()
    .positive({ message: "Valor deve ser maior que zero" }),
});

export type UpsertCardPriceSchema = z.infer<typeof upsertCardPriceSchema>;
