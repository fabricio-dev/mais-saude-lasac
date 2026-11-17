import { z } from "zod";

// Os mesmos filtros da URL de /patients (o de vencidos é sempre aplicado)
export const exportExpiredContactsSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type ExportExpiredContactsSchema = z.infer<
  typeof exportExpiredContactsSchema
>;
