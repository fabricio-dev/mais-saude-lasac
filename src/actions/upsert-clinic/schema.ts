import { z } from "zod";

export const upsertClinicSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: "Nome da clínica é obrigatório" }),
});

export type UpsertClinicSchema = z.infer<typeof upsertClinicSchema>;
