import { z } from "zod";

export const upsertSellerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  email: z.string().trim().email({ message: "Email inválido" }),
  cpfNumber: z.string().trim().min(11, { message: "CPF inválido" }),
  phoneNumber: z.string().trim().min(11, { message: "Telefone é obrigatório" }),
  clinicId: z.string().uuid().min(1, { message: "Unidade é obrigatória" }),
  percentage: z.number().min(0, { message: "Porcentagem é obrigatória" }),
  pixKey: z.string().trim().optional(),
  pixKeyType: z.string().trim().optional(),
});
export type UpsertSellerSchema = z.infer<typeof upsertSellerSchema>;
